import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { z } from 'zod';
import { getAllFaq, createFaqItem, FaqError } from '@/services/faq';
import { successResponse, errorResponse } from '@/utils/api-response';

const createSchema = z.object({
  category: z.string().min(1).max(100),
  question: z.string().min(5).max(500),
  answer: z.string().min(5),
  sortOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
});

export const GET = withRole('manager', 'admin')(async () => {
  try {
    const faq = await getAllFaq();
    return successResponse(faq);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const POST = withRole('manager', 'admin')(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Невалідні дані', 422);
    }

    const item = await createFaqItem(parsed.data);
    return successResponse(item, 201);
  } catch (error) {
    if (error instanceof FaqError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
