import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { importProducts, ImportError } from '@/services/import';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withRole('manager', 'admin')(async (request: NextRequest, { user }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return errorResponse('Файл не надано. Завантажте Excel-файл (.xlsx)', 400);
    }

    if (!file.name.endsWith('.xlsx')) {
      return errorResponse('Підтримується лише формат .xlsx', 400);
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return errorResponse('Максимальний розмір файлу: 10 МБ', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importProducts(buffer, file.name, user.id);

    return successResponse(result, 200);
  } catch (error) {
    if (error instanceof ImportError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
