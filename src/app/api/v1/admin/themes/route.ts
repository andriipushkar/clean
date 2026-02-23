import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getAllThemes, uploadTheme, ThemeError } from '@/services/theme';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin')(
  async (_request: NextRequest) => {
    try {
      const themes = await getAllThemes();
      return successResponse(themes);
    } catch (error) {
      if (error instanceof ThemeError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);

export const POST = withRole('admin')(
  async (request: NextRequest) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return errorResponse('Файл не надано', 400);
      }

      if (!file.name.endsWith('.zip')) {
        return errorResponse('Підтримуються лише ZIP-архіви', 400);
      }

      if (file.size > 10 * 1024 * 1024) {
        return errorResponse('Максимальний розмір файлу: 10 МБ', 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const theme = await uploadTheme(buffer, file.name);

      return successResponse(theme, 201);
    } catch (error) {
      if (error instanceof ThemeError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
