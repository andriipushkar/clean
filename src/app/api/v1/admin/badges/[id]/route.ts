import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const body = await request.json();

      const badge = await prisma.productBadge.update({
        where: { id: Number(id) },
        data: body,
      });
      return successResponse(badge);
    } catch {
      return errorResponse('Помилка оновлення бейджа', 500);
    }
  }
);

export const DELETE = withRole('admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      await prisma.productBadge.delete({ where: { id: Number(id) } });
      return successResponse({ deleted: true });
    } catch {
      return errorResponse('Помилка видалення бейджа', 500);
    }
  }
);
