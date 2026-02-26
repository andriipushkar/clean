import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { deleteProductImage, ImageError } from '@/services/image';
import { successResponse, errorResponse } from '@/utils/api-response';
import { cacheInvalidate } from '@/services/cache';

export const DELETE = withRole('manager', 'admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { imageId } = await params!;
      await deleteProductImage(Number(imageId));
      await cacheInvalidate('products:*');
      return successResponse({ message: 'Зображення видалено' });
    } catch (error) {
      if (error instanceof ImageError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
