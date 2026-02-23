import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getSeoTemplates, createSeoTemplate, SeoTemplateError } from '@/services/seo-template';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(
  async () => {
    try {
      const templates = await getSeoTemplates();
      return successResponse(templates);
    } catch (error) {
      if (error instanceof SeoTemplateError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Помилка завантаження шаблонів', 500);
    }
  }
);

export const POST = withRole('admin')(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const template = await createSeoTemplate(body);
      return successResponse(template, 201);
    } catch (error) {
      if (error instanceof SeoTemplateError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Помилка створення шаблону', 500);
    }
  }
);
