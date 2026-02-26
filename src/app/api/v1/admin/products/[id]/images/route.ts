import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { processProductImage, ImageError } from '@/services/image';
import { successResponse, errorResponse } from '@/utils/api-response';
import { cacheInvalidate } from '@/services/cache';

export const POST = withRole('manager', 'admin')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const productId = Number(id);
      if (isNaN(productId)) return errorResponse('Невалідний ID', 400);

      const formData = await request.formData();
      const file = formData.get('images');
      const isMain = formData.get('isMain') === 'true';

      if (!file || !(file instanceof File)) {
        return errorResponse('Зображення не надано', 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const image = await processProductImage(
        buffer,
        file.type,
        file.name,
        productId,
        isMain
      );

      await cacheInvalidate('products:*');
      return successResponse(image, 201);
    } catch (error) {
      if (error instanceof ImageError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
