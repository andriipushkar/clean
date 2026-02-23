import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import crypto from 'crypto';

const AUTH_TOKEN = process.env.VIBER_AUTH_TOKEN || '';
const API_URL = 'https://chatapi.viber.com/pa';

const LINK_CODE_TTL = 600; // 10 minutes

interface ViberEvent {
  event: string;
  timestamp: number;
  user_id?: string;
  sender?: { id: string; name: string };
  message?: { text?: string; type: string };
  user?: { id: string; name: string };
}

export function verifyViberSignature(body: string, signature: string): boolean {
  if (!AUTH_TOKEN) return true; // Skip in dev
  const hash = crypto.createHmac('sha256', AUTH_TOKEN).update(body).digest('hex');
  return hash === signature;
}

async function sendTextMessage(receiverId: string, text: string, keyboard?: unknown) {
  const body: Record<string, unknown> = {
    receiver: receiverId,
    min_api_version: 7,
    type: 'text',
    text,
  };
  if (keyboard) body.keyboard = keyboard;

  await fetch(`${API_URL}/send_message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Viber-Auth-Token': AUTH_TOKEN },
    body: JSON.stringify(body),
  });
}

async function findLinkedUser(viberId: string) {
  return prisma.user.findFirst({
    where: { viberUserId: viberId },
    select: { id: true, fullName: true, role: true },
  });
}

const MAIN_KEYBOARD = {
  Type: 'keyboard',
  DefaultHeight: false,
  Buttons: [
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'catalog', Text: '🛒 Каталог', BgColor: '#2563eb', TextSize: 'medium' },
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'promo', Text: '🔥 Акції', BgColor: '#dc2626', TextSize: 'medium' },
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'orders', Text: '📦 Замовлення', BgColor: '#059669', TextSize: 'medium' },
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'contact', Text: 'ℹ️ Інфо', BgColor: '#6b7280', TextSize: 'medium' },
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'wishlist', Text: '❤️ Обране', BgColor: '#ec4899', TextSize: 'medium' },
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'faq', Text: '❓ Часті питання', BgColor: '#8b5cf6', TextSize: 'medium' },
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'recommend', Text: '👥 Порекомендувати', BgColor: '#f59e0b', TextSize: 'medium' },
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'stop_notifications', Text: '🔕 Сповіщення', BgColor: '#ef4444', TextSize: 'medium' },
    { Columns: 2, Rows: 1, ActionType: 'reply', ActionBody: 'settings', Text: '⚙️ Меню', BgColor: '#6b7280', TextSize: 'medium' },
  ],
};

/**
 * Start account linking: user sends their email, we generate a 6-digit code
 * and store it in Redis. User must enter this code on the website or back in Viber.
 */
async function handleLinkStart(viberId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, fullName: true, viberUserId: true },
  });

  if (!user) {
    await sendTextMessage(viberId, '❌ Акаунт з такою email-адресою не знайдено. Перевірте правильність email.', MAIN_KEYBOARD);
    return;
  }

  if (user.viberUserId === viberId) {
    await sendTextMessage(viberId, '✅ Ваш акаунт вже прив\'язано!', MAIN_KEYBOARD);
    return;
  }

  // Generate 6-digit verification code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await redis.setex(`viber:link:${viberId}`, LINK_CODE_TTL, JSON.stringify({ email: email.toLowerCase().trim(), code, userId: user.id }));

  await sendTextMessage(
    viberId,
    `📩 Код підтвердження відправлено!\n\nВведіть код: відправте його у цей чат для підтвердження.\n\nВаш код: ${code}\n\n⏰ Код дійсний 10 хвилин.`,
    MAIN_KEYBOARD
  );
}

/**
 * Verify the 6-digit code and link the Viber account.
 */
async function handleLinkVerify(viberId: string, inputCode: string) {
  const stored = await redis.get(`viber:link:${viberId}`);
  if (!stored) {
    await sendTextMessage(viberId, '❌ Код прострочено або не знайдено. Спробуйте ще раз: відправте /link ваш@email.com', MAIN_KEYBOARD);
    return;
  }

  const { code, userId } = JSON.parse(stored) as { email: string; code: string; userId: number };

  if (inputCode.trim() !== code) {
    await sendTextMessage(viberId, '❌ Невірний код. Спробуйте ще раз.', MAIN_KEYBOARD);
    return;
  }

  // Link account
  await prisma.user.update({
    where: { id: userId },
    data: { viberUserId: viberId },
  });

  await redis.del(`viber:link:${viberId}`);

  await sendTextMessage(viberId, '✅ Акаунт успішно прив\'язано! Тепер ви отримуватимете сповіщення у Viber.', MAIN_KEYBOARD);
}

/**
 * Send a notification to a user via Viber (by userId).
 * Used by notification-queue for dispatching Viber notifications.
 */
export async function sendViberNotification(
  userId: number,
  title: string,
  message: string,
  link?: string | null
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { viberUserId: true },
  });

  if (!user?.viberUserId) return;

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  let text = `📢 ${title}\n\n${message}`;
  if (link) {
    text += `\n\n🔗 ${appUrl}${link}`;
  }

  await sendTextMessage(user.viberUserId, text, MAIN_KEYBOARD);
}

async function handleSubscribed(userId: string, name: string) {
  await sendTextMessage(
    userId,
    `Вітаємо у Clean Shop, ${name}! 👋\n\nОберіть дію з меню нижче або напишіть назву товару для пошуку.`,
    MAIN_KEYBOARD
  );
}

async function sendRichMediaCarousel(
  receiverId: string,
  products: { name: string; slug: string; code: string; price: number; imagePath?: string | null }[]
) {
  if (products.length === 0) return;

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const buttons = products.flatMap((p) => {
    const image = p.imagePath ? `${appUrl}${p.imagePath}` : `${appUrl}/images/placeholder.png`;
    return [
      {
        Columns: 6, Rows: 3,
        ActionType: 'open-url',
        ActionBody: `${appUrl}/product/${p.slug}?utm_source=viber`,
        Image: image,
      },
      {
        Columns: 6, Rows: 2,
        ActionType: 'open-url',
        ActionBody: `${appUrl}/product/${p.slug}?utm_source=viber`,
        Text: `<b>${p.name}</b><br><font color="#666">${p.code}</font><br><b>${p.price.toFixed(2)} ₴</b>`,
        TextSize: 'small',
        TextVAlign: 'middle',
        TextHAlign: 'left',
      },
      {
        Columns: 6, Rows: 1,
        ActionType: 'open-url',
        ActionBody: `${appUrl}/product/${p.slug}?utm_source=viber`,
        Text: '<b>🛒 Купити</b>',
        TextSize: 'regular',
        TextVAlign: 'middle',
        TextHAlign: 'center',
        BgColor: '#2563eb',
      },
    ];
  });

  await fetch(`${API_URL}/send_message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Viber-Auth-Token': AUTH_TOKEN },
    body: JSON.stringify({
      receiver: receiverId,
      min_api_version: 7,
      type: 'rich_media',
      rich_media: {
        Type: 'rich_media',
        ButtonsGroupColumns: 6,
        ButtonsGroupRows: 6,
        BgColor: '#FFFFFF',
        Buttons: buttons,
      },
    }),
  });
}

async function handleCatalog(userId: string, page = 1) {
  const pageSize = 6;
  const categories = await prisma.category.findMany({
    where: { isVisible: true, parentId: null },
    select: { name: true, slug: true },
    orderBy: { sortOrder: 'asc' },
    skip: (page - 1) * pageSize,
    take: pageSize + 1, // Fetch one extra to check if there are more
  });

  const hasMore = categories.length > pageSize;
  const displayCategories = categories.slice(0, pageSize);

  if (displayCategories.length === 0 && page === 1) {
    await sendTextMessage(userId, 'Каталог порожній.', MAIN_KEYBOARD);
    return;
  }

  // Store current page in Redis for "next page" navigation
  await redis.setex(`viber:catalog_page:${userId}`, 3600, String(page));

  const catList = displayCategories.map((c) => `• ${c.name}`).join('\n');
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const navButtons = [];
  if (page > 1) {
    navButtons.push({
      Columns: 3, Rows: 1, ActionType: 'reply',
      ActionBody: 'catalog_prev',
      Text: '⬅️ Назад', BgColor: '#6b7280', TextSize: 'medium',
    });
  }
  if (hasMore) {
    navButtons.push({
      Columns: page > 1 ? 3 : 6, Rows: 1, ActionType: 'reply',
      ActionBody: 'catalog_next',
      Text: 'Далі ➡️', BgColor: '#6b7280', TextSize: 'medium',
    });
  }

  await sendTextMessage(
    userId,
    `📂 Категорії (стор. ${page}):\n\n${catList}\n\nПерегляньте повний каталог на сайті:`,
    {
      ...MAIN_KEYBOARD,
      Buttons: [
        {
          Columns: 6, Rows: 1, ActionType: 'open-url',
          ActionBody: `${appUrl}/catalog?utm_source=viber`,
          Text: '🛒 Відкрити каталог', BgColor: '#2563eb',
        },
        ...navButtons,
        ...MAIN_KEYBOARD.Buttons,
      ],
    }
  );
}

async function handlePromo(userId: string) {
  const products = await prisma.product.findMany({
    where: { isActive: true, isPromo: true },
    select: { name: true, slug: true, code: true, priceRetail: true, imagePath: true },
    take: 5,
  });

  if (products.length === 0) {
    await sendTextMessage(userId, 'Наразі немає активних акцій.', MAIN_KEYBOARD);
    return;
  }

  await sendTextMessage(userId, '🔥 Акційні товари:');
  await sendRichMediaCarousel(
    userId,
    products.map((p) => ({ ...p, price: Number(p.priceRetail) }))
  );
}

async function handleOrders(userId: string) {
  const user = await findLinkedUser(userId);
  if (!user) {
    await sendTextMessage(userId, 'Для перегляду замовлень увійдіть в акаунт на сайті.', MAIN_KEYBOARD);
    return;
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    select: { orderNumber: true, status: true, totalAmount: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (orders.length === 0) {
    await sendTextMessage(userId, 'У вас ще немає замовлень.', MAIN_KEYBOARD);
    return;
  }

  const list = orders
    .map((o) => `#${o.orderNumber} — ${Number(o.totalAmount).toFixed(2)} ₴`)
    .join('\n');
  await sendTextMessage(userId, `📦 Ваші замовлення:\n\n${list}`, MAIN_KEYBOARD);
}

async function handleSearch(userId: string, query: string) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { name: true, slug: true, priceRetail: true },
    take: 5,
  });

  if (products.length === 0) {
    await sendTextMessage(userId, `За запитом «${query}» нічого не знайдено.`, MAIN_KEYBOARD);
    return;
  }

  const list = products.map((p) => `• ${p.name} — ${Number(p.priceRetail).toFixed(2)} ₴`).join('\n');
  await sendTextMessage(userId, `🔍 Результати:\n\n${list}`, MAIN_KEYBOARD);
}

async function handleOrderTracking(userId: string, orderNumber: string) {
  const user = await findLinkedUser(userId);
  if (!user) {
    await sendTextMessage(userId, 'Для перегляду замовлень прив\'яжіть акаунт: /link ваш@email.com', MAIN_KEYBOARD);
    return;
  }

  const order = await prisma.order.findFirst({
    where: { userId: user.id, orderNumber },
    select: { orderNumber: true, status: true, totalAmount: true, createdAt: true, trackingNumber: true, deliveryMethod: true },
  });

  if (!order) {
    await sendTextMessage(userId, `Замовлення #${orderNumber} не знайдено.`, MAIN_KEYBOARD);
    return;
  }

  const statusLabels: Record<string, string> = {
    new_order: '🆕 Нове', processing: '⏳ В обробці', confirmed: '✅ Підтверджене',
    paid: '💳 Оплачене', shipped: '🚚 Відправлене', completed: '✨ Виконане',
    cancelled: '❌ Скасоване', returned: '↩️ Повернення',
  };

  let text = `📦 Замовлення #${order.orderNumber}\n\nСтатус: ${statusLabels[order.status] || order.status}\nСума: ${Number(order.totalAmount).toFixed(2)} ₴\nДата: ${new Date(order.createdAt).toLocaleDateString('uk-UA')}`;
  if (order.trackingNumber) text += `\nТТН: ${order.trackingNumber}`;

  await sendTextMessage(userId, text, MAIN_KEYBOARD);
}

async function handleWishlist(userId: string) {
  const user = await findLinkedUser(userId);
  if (!user) {
    await sendTextMessage(userId, 'Для перегляду обраного прив\'яжіть акаунт: /link ваш@email.com', MAIN_KEYBOARD);
    return;
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { wishlist: { userId: user.id } },
    include: { product: { select: { name: true, slug: true, code: true, priceRetail: true, imagePath: true } } },
    take: 5,
    orderBy: { addedAt: 'desc' },
  });

  if (wishlistItems.length === 0) {
    await sendTextMessage(userId, '❤️ Ваш список обраного порожній.', MAIN_KEYBOARD);
    return;
  }

  await sendTextMessage(userId, '❤️ Ваше обране:');
  await sendRichMediaCarousel(
    userId,
    wishlistItems.map((item) => ({ ...item.product, price: Number(item.product.priceRetail) }))
  );
}

async function handleContact(userId: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  await sendTextMessage(
    userId,
    `📞 Контакти Clean Shop\n\nТелефон: +380 XX XXX XX XX\nEmail: info@cleanshop.ua\nГрафік: Пн-Пт 9:00-18:00\nСайт: ${appUrl}`,
    MAIN_KEYBOARD
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────
async function handleFaqCategories(userId: string) {
  const items = await prisma.faqItem.findMany({
    where: { isPublished: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  if (items.length === 0) {
    await sendTextMessage(userId, 'Наразі немає питань у розділі FAQ.', MAIN_KEYBOARD);
    return;
  }

  const categories = items.map((i) => i.category);
  const catButtons = categories.map((cat) => ({
    Columns: 6, Rows: 1, ActionType: 'reply' as const,
    ActionBody: `faq_cat:${cat}`,
    Text: `📂 ${cat}`, BgColor: '#8b5cf6', TextSize: 'medium' as const,
  }));

  await sendTextMessage(
    userId,
    '❓ Часті питання\n\nОберіть категорію:',
    {
      Type: 'keyboard',
      DefaultHeight: false,
      Buttons: [
        ...catButtons,
        { Columns: 6, Rows: 1, ActionType: 'reply', ActionBody: 'main_menu', Text: '⬅️ Головне меню', BgColor: '#6b7280', TextSize: 'medium' },
      ],
    }
  );
}

async function handleFaqQuestions(userId: string, category: string) {
  const questions = await prisma.faqItem.findMany({
    where: { isPublished: true, category },
    select: { id: true, question: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (questions.length === 0) {
    await sendTextMessage(userId, `У категорії «${category}» немає питань.`, MAIN_KEYBOARD);
    return;
  }

  const questionButtons = questions.map((q) => ({
    Columns: 6, Rows: 1, ActionType: 'reply' as const,
    ActionBody: `faq_q:${q.id}`,
    Text: `❔ ${q.question}`, BgColor: '#ddd6fe', TextSize: 'small' as const,
  }));

  await sendTextMessage(
    userId,
    `📂 ${category}\n\nОберіть питання:`,
    {
      Type: 'keyboard',
      DefaultHeight: false,
      Buttons: [
        ...questionButtons,
        { Columns: 3, Rows: 1, ActionType: 'reply', ActionBody: 'faq', Text: '⬅️ Категорії', BgColor: '#8b5cf6', TextSize: 'medium' },
        { Columns: 3, Rows: 1, ActionType: 'reply', ActionBody: 'main_menu', Text: '🏠 Меню', BgColor: '#6b7280', TextSize: 'medium' },
      ],
    }
  );
}

async function handleFaqAnswer(userId: string, questionId: number) {
  const item = await prisma.faqItem.findUnique({
    where: { id: questionId, isPublished: true },
  });

  if (!item) {
    await sendTextMessage(userId, 'Питання не знайдено.', MAIN_KEYBOARD);
    return;
  }

  // Increment click counter
  await prisma.faqItem.update({
    where: { id: questionId },
    data: { clickCount: { increment: 1 } },
  });

  await sendTextMessage(
    userId,
    `❓ ${item.question}\n\n${item.answer}`,
    {
      Type: 'keyboard',
      DefaultHeight: false,
      Buttons: [
        { Columns: 3, Rows: 1, ActionType: 'reply', ActionBody: `faq_cat:${item.category}`, Text: `⬅️ ${item.category}`, BgColor: '#8b5cf6', TextSize: 'medium' },
        { Columns: 3, Rows: 1, ActionType: 'reply', ActionBody: 'faq', Text: '📂 Категорії', BgColor: '#8b5cf6', TextSize: 'medium' },
        ...MAIN_KEYBOARD.Buttons,
      ],
    }
  );
}

// ─── Recommend to friend ─────────────────────────────────────────────
async function handleRecommend(userId: string) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  await sendTextMessage(
    userId,
    `👥 Порекомендуйте нас друзям!\n\nПоділіться з друзями! Відправте це посилання:\n${appUrl}?utm_source=viber&utm_medium=share\n\nПросто перешліть це повідомлення другу 👆`,
    MAIN_KEYBOARD
  );
}

// ─── Stop notifications ──────────────────────────────────────────────
async function handleNotificationSettings(userId: string) {
  const user = await findLinkedUser(userId);
  if (!user) {
    await sendTextMessage(
      userId,
      'Для управління сповіщеннями прив\'яжіть акаунт: /link ваш@email.com',
      MAIN_KEYBOARD
    );
    return;
  }

  await sendTextMessage(
    userId,
    '🔔 Сповіщення\n\nОберіть дію:',
    {
      Type: 'keyboard',
      DefaultHeight: false,
      Buttons: [
        { Columns: 6, Rows: 1, ActionType: 'reply', ActionBody: 'stop_notif_confirm', Text: '🔕 Зупинити сповіщення', BgColor: '#ef4444', TextSize: 'medium' },
        { Columns: 6, Rows: 1, ActionType: 'reply', ActionBody: 'main_menu', Text: '⬅️ Головне меню', BgColor: '#6b7280', TextSize: 'medium' },
      ],
    }
  );
}

async function handleStopNotifications(userId: string) {
  const user = await findLinkedUser(userId);
  if (!user) {
    await sendTextMessage(
      userId,
      'Для управління сповіщеннями прив\'яжіть акаунт: /link ваш@email.com',
      MAIN_KEYBOARD
    );
    return;
  }

  // Get current prefs and disable viber channels
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { notificationPrefs: true },
  });

  const currentPrefs = (fullUser?.notificationPrefs as Record<string, boolean>) || {};
  const updatedPrefs = {
    ...currentPrefs,
    viber_orders: false,
    viber_promo: false,
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { notificationPrefs: updatedPrefs },
  });

  await sendTextMessage(
    userId,
    '✅ Ви відписались від сповіщень у Viber.\n\nЩоб знову отримувати сповіщення, змініть налаштування на сайті або напишіть /start_notifications',
    MAIN_KEYBOARD
  );
}

async function handleStartNotifications(userId: string) {
  const user = await findLinkedUser(userId);
  if (!user) {
    await sendTextMessage(
      userId,
      'Для управління сповіщеннями прив\'яжіть акаунт: /link ваш@email.com',
      MAIN_KEYBOARD
    );
    return;
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { notificationPrefs: true },
  });

  const currentPrefs = (fullUser?.notificationPrefs as Record<string, boolean>) || {};
  const updatedPrefs = {
    ...currentPrefs,
    viber_orders: true,
    viber_promo: true,
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { notificationPrefs: updatedPrefs },
  });

  await sendTextMessage(
    userId,
    '✅ Сповіщення у Viber увімкнено!\n\nВи отримуватимете сповіщення про замовлення та акції.',
    MAIN_KEYBOARD
  );
}

export async function handleViberEvent(event: ViberEvent) {
  try {
    if (event.event === 'subscribed' && event.user) {
      await handleSubscribed(event.user.id, event.user.name);
      return;
    }

    if (event.event === 'message' && event.sender && event.message?.text) {
      const { id: userId } = event.sender;
      const text = event.message.text;

      if (text === 'catalog') return handleCatalog(userId);
      if (text === 'catalog_next') {
        const currentPage = Number(await redis.get(`viber:catalog_page:${userId}`)) || 1;
        return handleCatalog(userId, currentPage + 1);
      }
      if (text === 'catalog_prev') {
        const currentPage = Number(await redis.get(`viber:catalog_page:${userId}`)) || 2;
        return handleCatalog(userId, Math.max(1, currentPage - 1));
      }
      if (text === 'promo') return handlePromo(userId);
      if (text === 'orders') return handleOrders(userId);
      if (text === 'wishlist') return handleWishlist(userId);
      if (text === 'contact' || text === 'help') return handleContact(userId);
      if (text === 'settings' || text === 'menu' || text === 'main_menu') return handleSubscribed(userId, event.sender.name);

      // FAQ navigation
      if (text === 'faq') return handleFaqCategories(userId);
      if (text.startsWith('faq_cat:')) {
        const category = text.slice(8);
        if (category) return handleFaqQuestions(userId, category);
      }
      if (text.startsWith('faq_q:')) {
        const qId = parseInt(text.slice(6), 10);
        if (!isNaN(qId)) return handleFaqAnswer(userId, qId);
      }

      // Recommend to friend
      if (text === 'recommend') return handleRecommend(userId);

      // Notification management
      if (text === 'stop_notifications') return handleNotificationSettings(userId);
      if (text === 'stop_notif_confirm') return handleStopNotifications(userId);
      if (text === '/start_notifications') return handleStartNotifications(userId);

      // Order tracking: /track ORDER_NUMBER
      if (text.startsWith('/track ')) {
        const orderNumber = text.slice(7).trim();
        if (orderNumber) return handleOrderTracking(userId, orderNumber);
      }

      // Account linking: /link email@example.com
      if (text.startsWith('/link ')) {
        const email = text.slice(6).trim();
        if (email.includes('@')) {
          return handleLinkStart(userId, email);
        }
        await sendTextMessage(userId, 'Використання: /link ваш@email.com', MAIN_KEYBOARD);
        return;
      }

      // Check if user is in linking flow (entering verification code)
      if (/^\d{6}$/.test(text.trim())) {
        const pending = await redis.get(`viber:link:${userId}`);
        if (pending) {
          return handleLinkVerify(userId, text.trim());
        }
      }

      // Treat as search
      if (text.length >= 2) {
        return handleSearch(userId, text);
      }
    }
  } catch (error) {
    console.error('Viber event error:', error);
  }
}
