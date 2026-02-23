import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { activateTheme, ThemeError } from '@/services/theme';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const themeId = Number(id);

      if (!themeId || isNaN(themeId)) {
        return errorResponse('Невалідний ID теми', 400);
      }

      const theme = await activateTheme(themeId);
      return successResponse(theme);
    } catch (error) {
      if (error instanceof ThemeError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
