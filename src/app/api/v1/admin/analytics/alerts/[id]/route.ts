import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(async (request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const numId = Number(id);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    const body = await request.json();

    const alert = await prisma.analyticsAlert.findFirst({
      where: { id: numId, createdBy: user.id },
    });

    if (!alert) {
      return errorResponse('Сповіщення не знайдено', 404);
    }

    const updated = await prisma.analyticsAlert.update({
      where: { id: numId },
      data: {
        isActive: body.isActive ?? alert.isActive,
      },
    });

    return successResponse(updated);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const DELETE = withRole('admin', 'manager')(async (_request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const numId = Number(id);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);

    const alert = await prisma.analyticsAlert.findFirst({
      where: { id: numId, createdBy: user.id },
    });

    if (!alert) {
      return errorResponse('Сповіщення не знайдено', 404);
    }

    await prisma.analyticsAlert.delete({ where: { id: numId } });

    return successResponse({ deleted: true });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
