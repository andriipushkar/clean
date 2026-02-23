import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getImportLogById } from '@/services/import';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('manager', 'admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const log = await getImportLogById(Number(id));

      if (!log) {
        return errorResponse('Лог імпорту не знайдено', 404);
      }

      return successResponse(log);
    } catch {
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
