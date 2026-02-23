import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { z } from 'zod';
import { updatePage, deletePage, StaticPageError } from '@/services/static-page';
import { successResponse, errorResponse } from '@/utils/api-response';

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(200).optional(),
  content: z.string().min(1).optional(),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const PUT = withRole('manager', 'admin')(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id } = await params!;
      const body = await request.json();
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(parsed.error.issues[0]?.message || 'Невалідні дані', 422);
      }

      const page = await updatePage(Number(id), { ...parsed.data, updatedBy: user.id });
      return successResponse(page);
    } catch (error) {
      if (error instanceof StaticPageError) return errorResponse(error.message, error.statusCode);
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);

export const DELETE = withRole('manager', 'admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      await deletePage(Number(id));
      return successResponse({ message: 'Сторінку видалено' });
    } catch (error) {
      if (error instanceof StaticPageError) return errorResponse(error.message, error.statusCode);
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
