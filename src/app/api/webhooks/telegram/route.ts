import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/services/telegram';

export async function POST(request: NextRequest) {
  try {
    // Verify secret token if configured
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secretToken) {
      const header = request.headers.get('x-telegram-bot-api-secret-token');
      if (header !== secretToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const update = await request.json();
    // Process asynchronously to respond quickly
    handleTelegramUpdate(update).catch((err) => console.error('Telegram processing error:', err));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
