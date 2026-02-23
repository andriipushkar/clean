import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const body = await request.json();
      const reply = await prisma.botAutoReply.update({
        where: { id: Number(id) },
        data: body,
      });
      return successResponse(reply);
    } catch {
      return errorResponse('Помилка оновлення авто-відповіді', 500);
    }
  }
);

export const DELETE = withRole('admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      await prisma.botAutoReply.delete({ where: { id: Number(id) } });
      return successResponse({ deleted: true });
    } catch {
      return errorResponse('Помилка видалення авто-відповіді', 500);
    }
  }
);
