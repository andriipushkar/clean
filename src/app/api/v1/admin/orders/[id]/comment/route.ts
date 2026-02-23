import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

const commentSchema = z.object({
  comment: z.string().max(2000),
});

export const PUT = withRole('admin', 'manager')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const orderId = Number(id);

      const body = await request.json();
      const parsed = commentSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(parsed.error.issues[0].message, 422);
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return errorResponse('Замовлення не знайдено', 404);

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { managerComment: parsed.data.comment },
        select: { id: true, managerComment: true },
      });

      return successResponse(updated);
    } catch {
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
