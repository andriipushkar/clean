import { NextResponse } from 'next/server';
import { getActiveTheme } from '@/services/theme';

export async function GET() {
  try {
    const theme = await getActiveTheme();
    return NextResponse.json({ success: true, data: theme });
  } catch {
    return NextResponse.json({ success: false, error: 'Помилка завантаження теми' }, { status: 500 });
  }
}
