import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { updateCategorySchema } from '@/validators/category';
import { getCategoryById, updateCategory, deleteCategory, CategoryError } from '@/services/category';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('manager', 'admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const category = await getCategoryById(Number(id));

      if (!category) {
        return errorResponse('Категорію не знайдено', 404);
      }

      return successResponse(category);
    } catch {
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);

export const PUT = withRole('manager', 'admin')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const body = await request.json();
      const parsed = updateCategorySchema.safeParse(body);

      if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Невалідні дані';
        return errorResponse(firstError, 422);
      }

      const category = await updateCategory(Number(id), parsed.data);
      return successResponse(category);
    } catch (error) {
      if (error instanceof CategoryError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);

export const DELETE = withRole('manager', 'admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      await deleteCategory(Number(id));
      return successResponse({ message: 'Категорію видалено' });
    } catch (error) {
      if (error instanceof CategoryError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
