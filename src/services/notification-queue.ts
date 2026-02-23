import { prisma } from '@/lib/prisma';
import { sendEmail } from './email';

/**
 * Process pending notifications and send them via configured channels.
 * Checks user notification preferences before sending.
 */
export async function processNotificationQueue(): Promise<{ sent: number; skipped: number }> {
  // Get recent unread notifications that haven't been dispatched via external channels
  const notifications = await prisma.userNotification.findMany({
    where: {
      isRead: false,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24h
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          telegramChatId: true,
          viberUserId: true,
          notificationPrefs: true,
        },
      },
    },
    take: 100,
    orderBy: { createdAt: 'asc' },
  });

  let sent = 0;
  let skipped = 0;

  for (const notification of notifications) {
    const prefs = (notification.user.notificationPrefs as Record<string, boolean>) || {};
    const type = notification.notificationType;

    // Map notification type to preference keys
    const emailPrefKey = type === 'order_status' ? 'email_orders' : type === 'promo' ? 'email_promo' : 'email_orders';
    const tgPrefKey = type === 'order_status' ? 'telegram_orders' : type === 'promo' ? 'telegram_promo' : 'telegram_orders';

    // Email notification
    const shouldEmail = prefs[emailPrefKey] !== false; // default true
    if (shouldEmail && notification.user.email) {
      try {
        await sendEmail({
          to: notification.user.email,
          subject: notification.title,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
              <h2 style="color:#2563eb">${notification.title}</h2>
              <p>${notification.message}</p>
              ${notification.link ? `<a href="${process.env.APP_URL || ''}${notification.link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Переглянути</a>` : ''}
            </div>
          `,
        });
        sent++;
      } catch {
        skipped++;
      }
    }

    // Telegram notification
    const shouldTelegram = prefs[tgPrefKey] !== false; // default true
    if (shouldTelegram && notification.user.telegramChatId) {
      try {
        // order_status notifications are already sent inline during status change
        if (type !== 'order_status') {
          const { sendClientNotification } = await import('./telegram');
          await sendClientNotification(
            Number(notification.user.telegramChatId),
            notification.title,
            notification.message,
            notification.link
          );
        }
        sent++;
      } catch {
        skipped++;
      }
    }

    // Viber notification
    const viberPrefKey = type === 'order_status' ? 'viber_orders' : type === 'promo' ? 'viber_promo' : 'viber_orders';
    const shouldViber = prefs[viberPrefKey] !== false; // default true
    if (shouldViber && notification.user.viberUserId) {
      try {
        if (type !== 'order_status') {
          const { sendViberNotification } = await import('./viber');
          await sendViberNotification(
            notification.user.id,
            notification.title,
            notification.message,
            notification.link
          );
        }
        sent++;
      } catch {
        skipped++;
      }
    }

    // Push notification
    try {
      const { sendPushNotification } = await import('./push');
      await sendPushNotification(notification.user.id, {
        title: notification.title,
        body: notification.message,
        url: notification.link ?? undefined,
      });
      sent++;
    } catch {
      // Push not configured or no subscriptions — skip silently
    }
  }

  return { sent, skipped };
}
