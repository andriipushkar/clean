import { NextRequest } from 'next/server';
import { incrementFaqClick } from '@/services/faq';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await incrementFaqClick(Number(id));
    return successResponse({ message: 'ok' });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
