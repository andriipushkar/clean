import { NextRequest } from 'next/server';
import { callbackRequestSchema } from '@/validators/feedback';
import { createFeedback } from '@/services/feedback';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = callbackRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }

    const feedback = await createFeedback({
      name: parsed.data.name,
      phone: parsed.data.phone,
      message: parsed.data.message,
      type: 'callback',
    });

    // Notify manager via Telegram
    import('@/services/telegram')
      .then((mod) =>
        mod.notifyManagerFeedback({
          type: 'callback',
          name: parsed.data.name,
          phone: parsed.data.phone,
          message: parsed.data.message,
        })
      )
      .catch(() => {});

    return successResponse({ id: feedback.id, message: 'Запит на зворотний дзвінок створено' }, 201);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
