import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { updateSeoTemplate, deleteSeoTemplate, SeoTemplateError } from '@/services/seo-template';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const body = await request.json();
      const template = await updateSeoTemplate(Number(id), body);
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
      await deleteSeoTemplate(Number(id));
      return successResponse({ deleted: true });
    } catch (error) {
      if (error instanceof SeoTemplateError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Помилка видалення шаблону', 500);
    }
  }
);
