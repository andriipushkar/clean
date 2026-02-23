import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { parseQuickOrderInput, resolveQuickOrder, QuickOrderError } from '@/services/quick-order';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withRole('wholesaler', 'admin', 'manager')(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { input } = body;

      if (!input || typeof input !== 'string') {
        return errorResponse('Введіть список товарів (код — кількість)', 400);
      }

      const lines = parseQuickOrderInput(input);
      if (lines.length === 0) {
        return errorResponse('Не розпізнано жодного рядка. Формат: код кількість', 400);
      }

      const resolved = await resolveQuickOrder(lines);
      return successResponse(resolved);
    } catch (error) {
      if (error instanceof QuickOrderError) {
        return errorResponse(error.message, error.statusCode);
      }
      return errorResponse('Помилка обробки замовлення', 500);
    }
  }
);
