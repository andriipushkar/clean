import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set env vars BEFORE the telegram module is imported, so that
// BOT_TOKEN (captured at module level) is non-empty.
vi.hoisted(() => {
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_MANAGER_CHAT_ID = '12345';
  process.env.APP_URL = 'https://shop.test';
});

const fetchMock = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal('fetch', fetchMock);

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    category: { findMany: vi.fn() },
    product: { findMany: vi.fn() },
    order: { findMany: vi.fn() },
    siteSetting: { findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    setex: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import type { MockPrismaClient } from '@/test/prisma-mock';

const mockPrisma = prisma as unknown as MockPrismaClient;
const mockRedis = vi.mocked(redis);

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue({ ok: true });
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_MANAGER_CHAT_ID = '12345';
  process.env.APP_URL = 'https://shop.test';
});

import {
  sendClientNotification,
  notifyManagerNewOrder,
  notifyClientStatusChange,
  notifyManagerFeedback,
  generateLinkToken,
  linkTelegramAccount,
  handleTelegramUpdate,
} from './telegram';

// ---------------------------------------------------------------------------
// sendClientNotification
// ---------------------------------------------------------------------------

describe('sendClientNotification', () => {
  it('should send a message to the given chatId', async () => {
    await sendClientNotification(999, 'Test Title', 'Test body');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/sendMessage');
    const body = JSON.parse(opts.body);
    expect(body.chat_id).toBe(999);
    expect(body.text).toContain('Test Title');
    expect(body.text).toContain('Test body');
  });

  it('should include a link button when link is provided', async () => {
    await sendClientNotification(999, 'Title', 'Body', '/orders/123');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.reply_markup).toBeDefined();
    expect(body.reply_markup.inline_keyboard[0][0].url).toBe(
      'https://shop.test/orders/123',
    );
  });

  it('should not include reply_markup when link is not provided', async () => {
    await sendClientNotification(999, 'Title', 'Body');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.reply_markup).toBeUndefined();
  });
});

// Test the early-return guard via a fresh module loaded without BOT_TOKEN.
describe('sendClientNotification (no BOT_TOKEN)', () => {
  it('should early return when BOT_TOKEN is empty', async () => {
    vi.resetModules();
    delete process.env.TELEGRAM_BOT_TOKEN;

    const freshFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', freshFetch);

    const mod = await import('./telegram');
    await mod.sendClientNotification(999, 'Title', 'Body');

    expect(freshFetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// notifyManagerNewOrder
// ---------------------------------------------------------------------------

describe('notifyManagerNewOrder', () => {
  const order = {
    orderNumber: 'ORD-001',
    contactName: 'John Doe',
    contactPhone: '+380991112233',
    contactEmail: 'john@test.com',
    totalAmount: 1500.5,
    itemsCount: 3,
    clientType: 'retail',
    deliveryMethod: 'Nova Poshta',
    paymentMethod: 'Card',
  };

  it('should send formatted order notification to manager', async () => {
    await notifyManagerNewOrder(order);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/sendMessage');

    const body = JSON.parse(opts.body);
    expect(body.chat_id).toBe(12345);
    expect(body.text).toContain('#ORD-001');
    expect(body.text).toContain('John Doe');
    expect(body.text).toContain('+380991112233');
    expect(body.text).toContain('john@test.com');
    expect(body.text).toContain('1500.50');
    expect(body.text).toContain('Nova Poshta');
    expect(body.text).toContain('Card');
  });

  it('should label retail client type', async () => {
    await notifyManagerNewOrder(order);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain('Роздрібний');
  });

  it('should label wholesale client type', async () => {
    await notifyManagerNewOrder({ ...order, clientType: 'wholesale' });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain('Оптовий');
  });

  it('should skip when no TELEGRAM_MANAGER_CHAT_ID', async () => {
    delete process.env.TELEGRAM_MANAGER_CHAT_ID;

    await notifyManagerNewOrder(order);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should not throw when fetch fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network error'));

    await expect(notifyManagerNewOrder(order)).resolves.toBeUndefined();
  });
});

describe('notifyManagerNewOrder (no BOT_TOKEN)', () => {
  it('should early return when BOT_TOKEN is empty', async () => {
    vi.resetModules();
    delete process.env.TELEGRAM_BOT_TOKEN;

    const freshFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', freshFetch);

    const mod = await import('./telegram');
    await mod.notifyManagerNewOrder({
      orderNumber: 'X',
      contactName: 'X',
      contactPhone: 'X',
      totalAmount: 0,
      itemsCount: 0,
      clientType: 'retail',
      deliveryMethod: 'X',
      paymentMethod: 'X',
    });

    expect(freshFetch).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// notifyClientStatusChange
// ---------------------------------------------------------------------------

describe('notifyClientStatusChange', () => {
  it('should look up user and send status notification', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramChatId: BigInt(777),
    } as never);

    await notifyClientStatusChange(1, 'ORD-002', 'processing', 'confirmed');

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { telegramChatId: true },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.chat_id).toBe(777);
    expect(body.text).toContain('#ORD-002');
    expect(body.text).toContain('Підтверджено');
  });

  it('should skip when user has no telegramChatId', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramChatId: null,
    } as never);

    await notifyClientStatusChange(1, 'ORD-003', 'new_order', 'processing');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should skip when user is not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null as never);

    await notifyClientStatusChange(99, 'ORD-004', 'new_order', 'processing');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should include tracking number when status is shipped', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramChatId: BigInt(777),
    } as never);

    await notifyClientStatusChange(
      1,
      'ORD-005',
      'paid',
      'shipped',
      '20450000000001',
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain('Відправлено');
    expect(body.text).toContain('20450000000001');
    expect(body.text).toContain('ТТН');
  });

  it('should not include tracking number for non-shipped status', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramChatId: BigInt(777),
    } as never);

    await notifyClientStatusChange(
      1,
      'ORD-006',
      'new_order',
      'processing',
      '20450000000001',
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).not.toContain('ТТН');
  });

  it('should include cancellation text for cancelled status', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramChatId: BigInt(777),
    } as never);

    await notifyClientStatusChange(1, 'ORD-007', 'processing', 'cancelled');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain('Скасовано');
    expect(body.text).toContain('замовлення було скасовано');
  });

  it('should include thank-you text for completed status', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramChatId: BigInt(777),
    } as never);

    await notifyClientStatusChange(1, 'ORD-008', 'shipped', 'completed');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain('Завершено');
    expect(body.text).toContain('Дякуємо за покупку');
  });

  it('should include a link to account orders', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramChatId: BigInt(777),
    } as never);

    await notifyClientStatusChange(1, 'ORD-009', 'new_order', 'confirmed');

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.reply_markup.inline_keyboard[0][0].url).toBe(
      'https://shop.test/account/orders',
    );
  });
});

// ---------------------------------------------------------------------------
// notifyManagerFeedback
// ---------------------------------------------------------------------------

describe('notifyManagerFeedback', () => {
  it('should send callback feedback to manager', async () => {
    await notifyManagerFeedback({
      type: 'callback',
      name: 'Jane',
      phone: '+380501234567',
      message: 'Please call me',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.chat_id).toBe(12345);
    expect(body.text).toContain('Запит на зворотний дзвінок');
    expect(body.text).toContain('Jane');
    expect(body.text).toContain('+380501234567');
    expect(body.text).toContain('Please call me');
  });

  it('should send form feedback to manager', async () => {
    await notifyManagerFeedback({
      type: 'form',
      name: 'Bob',
      email: 'bob@test.com',
      subject: 'Question',
      message: 'Hello, I have a question about your products.',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain('Повідомлення зворотного зв');
    expect(body.text).toContain('Bob');
    expect(body.text).toContain('bob@test.com');
    expect(body.text).toContain('Question');
    expect(body.text).toContain('Hello, I have a question');
  });

  it('should skip when no TELEGRAM_MANAGER_CHAT_ID', async () => {
    delete process.env.TELEGRAM_MANAGER_CHAT_ID;

    await notifyManagerFeedback({
      type: 'form',
      name: 'X',
      message: 'Y',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should truncate long messages to 300 chars', async () => {
    const longMessage = 'A'.repeat(500);

    await notifyManagerFeedback({
      type: 'form',
      name: 'X',
      message: longMessage,
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const textContent = body.text as string;
    const aCount = (textContent.match(/A/g) || []).length;
    expect(aCount).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// generateLinkToken
// ---------------------------------------------------------------------------

describe('generateLinkToken', () => {
  it('should store token in Redis with 600s expiry and return it', async () => {
    const token = await generateLinkToken(555);

    expect(typeof token).toBe('string');
    expect(token.length).toBe(32); // 16 random bytes -> 32 hex chars

    expect(mockRedis.setex).toHaveBeenCalledWith(
      `tg_link:${token}`,
      600,
      '555',
    );
  });

  it('should generate unique tokens on each call', async () => {
    const token1 = await generateLinkToken(1);
    const token2 = await generateLinkToken(2);

    expect(token1).not.toBe(token2);
  });
});

// ---------------------------------------------------------------------------
// linkTelegramAccount
// ---------------------------------------------------------------------------

describe('linkTelegramAccount', () => {
  it('should link account successfully when token is valid', async () => {
    mockRedis.get.mockResolvedValue('777' as never);
    mockPrisma.user.update.mockResolvedValue({} as never);

    const result = await linkTelegramAccount(1, 'valid-token');

    expect(result).toBe(true);

    expect(mockRedis.get).toHaveBeenCalledWith('tg_link:valid-token');

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { telegramChatId: BigInt(777) },
    });

    expect(mockRedis.del).toHaveBeenCalledWith('tg_link:valid-token');

    // Should also send a confirmation message via fetch
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.chat_id).toBe(777);
    expect(body.text).toContain('успішно');
  });

  it('should return false for invalid/expired token', async () => {
    mockRedis.get.mockResolvedValue(null as never);

    const result = await linkTelegramAccount(1, 'expired-token');

    expect(result).toBe(false);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockRedis.del).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleTelegramUpdate
// ---------------------------------------------------------------------------

describe('handleTelegramUpdate', () => {
  // Ensure isBotWithinSchedule returns true (no schedule setting = always on)
  beforeEach(() => {
    mockPrisma.siteSetting.findUnique.mockResolvedValue(null as never);
  });

  it('should route /start command to start handler', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null as never);

    await handleTelegramUpdate({
      update_id: 1,
      message: {
        message_id: 1,
        from: { id: 100, first_name: 'Alice' },
        chat: { id: 100, type: 'private' },
        text: '/start',
        date: Date.now(),
      },
    });

    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.chat_id).toBe(100);
    expect(body.text).toContain('Alice');
    expect(body.reply_markup).toBeDefined();
    expect(body.reply_markup.inline_keyboard).toBeDefined();
  });

  it('should route /catalog command to catalog handler', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      { id: 1, name: 'Category One', slug: 'cat-one' },
    ] as never);

    await handleTelegramUpdate({
      update_id: 2,
      message: {
        message_id: 2,
        from: { id: 200, first_name: 'Bob' },
        chat: { id: 200, type: 'private' },
        text: '/catalog',
        date: Date.now(),
      },
    });

    expect(mockPrisma.category.findMany).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.chat_id).toBe(200);
    expect(body.text).toContain('категорію');
  });

  it('should route /search command with query', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { name: 'Soap', slug: 'soap', priceRetail: 99.99, code: 'SP1' },
    ] as never);

    await handleTelegramUpdate({
      update_id: 3,
      message: {
        message_id: 3,
        from: { id: 300, first_name: 'Carol' },
        chat: { id: 300, type: 'private' },
        text: '/search soap',
        date: Date.now(),
      },
    });

    expect(mockPrisma.product.findMany).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
    // First call is the "results" header, second is the product
    const headerBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(headerBody.text).toContain('soap');
  });

  it('should treat plain text as search query', async () => {
    mockPrisma.product.findMany.mockResolvedValue([] as never);

    await handleTelegramUpdate({
      update_id: 4,
      message: {
        message_id: 4,
        from: { id: 400, first_name: 'Dave' },
        chat: { id: 400, type: 'private' },
        text: 'shampoo',
        date: Date.now(),
      },
    });

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true,
          OR: expect.arrayContaining([
            expect.objectContaining({
              name: { contains: 'shampoo', mode: 'insensitive' },
            }),
          ]),
        }),
      }),
    );
  });

  it('should handle callback queries and route to catalog', async () => {
    mockPrisma.category.findMany.mockResolvedValue([] as never);

    await handleTelegramUpdate({
      update_id: 5,
      callback_query: {
        id: 'cb-1',
        from: { id: 500, first_name: 'Eve' },
        message: {
          message_id: 10,
          from: { id: 500, first_name: 'Eve' },
          chat: { id: 500, type: 'private' },
          date: Date.now(),
        },
        data: 'catalog',
      },
    });

    // Should call answerCallbackQuery
    const answerCall = fetchMock.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('/answerCallbackQuery'),
    );
    expect(answerCall).toBeDefined();
    const answerBody = JSON.parse(answerCall![1].body);
    expect(answerBody.callback_query_id).toBe('cb-1');

    // Should also query categories
    expect(mockPrisma.category.findMany).toHaveBeenCalled();
  });

  it('should handle callback query for promo', async () => {
    mockPrisma.product.findMany.mockResolvedValue([] as never);

    await handleTelegramUpdate({
      update_id: 6,
      callback_query: {
        id: 'cb-2',
        from: { id: 600, first_name: 'Frank' },
        message: {
          message_id: 20,
          from: { id: 600, first_name: 'Frank' },
          chat: { id: 600, type: 'private' },
          date: Date.now(),
        },
        data: 'promo',
      },
    });

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true, isPromo: true }),
      }),
    );
  });

  it('should handle inline queries for product search', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Cleaner',
        slug: 'cleaner',
        priceRetail: 50,
        code: 'CL1',
        imagePath: '/img/cl.jpg',
      },
    ] as never);

    await handleTelegramUpdate({
      update_id: 7,
      inline_query: {
        id: 'iq-1',
        from: { id: 700, first_name: 'Grace' },
        query: 'cleaner',
        offset: '',
      },
    });

    // Should call answerInlineQuery
    const inlineCall = fetchMock.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('/answerInlineQuery'),
    );
    expect(inlineCall).toBeDefined();
    const inlineBody = JSON.parse(inlineCall![1].body);
    expect(inlineBody.inline_query_id).toBe('iq-1');
    expect(inlineBody.results).toHaveLength(1);
    expect(inlineBody.results[0].title).toBe('Cleaner');
  });

  it('should answer inline query with empty results for short queries', async () => {
    await handleTelegramUpdate({
      update_id: 8,
      inline_query: {
        id: 'iq-2',
        from: { id: 800, first_name: 'Heidi' },
        query: 'a',
        offset: '',
      },
    });

    const inlineCall = fetchMock.mock.calls.find(
      (call: unknown[]) =>
        typeof call[0] === 'string' && call[0].includes('/answerInlineQuery'),
    );
    expect(inlineCall).toBeDefined();
    const inlineBody = JSON.parse(inlineCall![1].body);
    expect(inlineBody.results).toEqual([]);
  });

  it('should ignore callback query without chatId or data', async () => {
    await handleTelegramUpdate({
      update_id: 9,
      callback_query: {
        id: 'cb-3',
        from: { id: 900, first_name: 'Ivan' },
        // no message -> no chatId
        data: 'catalog',
      },
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should not throw on webhook errors', async () => {
    // Use a callback_query path which is fully awaited inside the try/catch.
    // The /start path uses `return handleStart(...)` (un-awaited return),
    // so errors from it propagate through the promise chain.
    mockPrisma.siteSetting.findUnique.mockRejectedValue(
      new Error('DB down'),
    );

    await expect(
      handleTelegramUpdate({
        update_id: 10,
        callback_query: {
          id: 'cb-err',
          from: { id: 1000, first_name: 'Judy' },
          message: {
            message_id: 10,
            from: { id: 1000, first_name: 'Judy' },
            chat: { id: 1000, type: 'private' },
            date: Date.now(),
          },
          data: 'catalog',
        },
      }),
    ).resolves.toBeUndefined();
  });
});
