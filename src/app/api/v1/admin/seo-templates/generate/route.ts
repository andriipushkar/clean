import { withRole } from '@/middleware/auth';
import { bulkGenerateProductSeo, SeoTemplateError } from '@/services/seo-template';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withRole('admin')(
  async () => {
    try {
      const result = await bulkGenerateProductSeo();
      return successResponse(result);
    } catch (error) {
      if (error instanceof SeoTemplateError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Помилка генерації SEO', 500);
    }
  }
);
