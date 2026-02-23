import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { z } from 'zod';
import { updateFaqItem, deleteFaqItem, FaqError } from '@/services/faq';
import { successResponse, errorResponse } from '@/utils/api-response';

const updateSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  question: z.string().min(5).max(500).optional(),
  answer: z.string().min(5).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const PUT = withRole('manager', 'admin')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const body = await request.json();
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(parsed.error.issues[0]?.message || 'Невалідні дані', 422);
      }

      const item = await updateFaqItem(Number(id), parsed.data);
      return successResponse(item);
    } catch (error) {
      if (error instanceof FaqError) return errorResponse(error.message, error.statusCode);
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);

export const DELETE = withRole('manager', 'admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      await deleteFaqItem(Number(id));
      return successResponse({ message: 'Питання видалено' });
    } catch (error) {
      if (error instanceof FaqError) return errorResponse(error.message, error.statusCode);
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
