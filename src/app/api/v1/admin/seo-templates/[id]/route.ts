import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { updateSeoTemplate, deleteSeoTemplate, SeoTemplateError } from '@/services/seo-template';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const numId = Number(id);
      if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
      const body = await request.json();
      const template = await updateSeoTemplate(numId, body);
      return successResponse(template);
    } catch (error) {
      if (error instanceof SeoTemplateError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Помилка оновлення шаблону', 500);
    }
  }
);

export const DELETE = withRole('admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const numId = Number(id);
      if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
      await deleteSeoTemplate(numId);
      return successResponse({ deleted: true });
    } catch (error) {
      if (error instanceof SeoTemplateError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Помилка видалення шаблону', 500);
    }
  }
);
