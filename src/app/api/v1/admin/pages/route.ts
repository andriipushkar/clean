import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { z } from 'zod';
import { getAllPages, createPage, StaticPageError } from '@/services/static-page';
import { successResponse, errorResponse } from '@/utils/api-response';

const createSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).max(200).optional(),
  content: z.string().min(1),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(320).optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const GET = withRole('manager', 'admin')(async () => {
  try {
    const pages = await getAllPages();
    return successResponse(pages);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const POST = withRole('manager', 'admin')(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Невалідні дані', 422);
    }

    const page = await createPage({ ...parsed.data, updatedBy: user.id });
    return successResponse(page, 201);
  } catch (error) {
    if (error instanceof StaticPageError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
