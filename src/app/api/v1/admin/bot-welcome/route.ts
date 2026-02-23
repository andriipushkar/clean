import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(
  async () => {
    try {
      const messages = await prisma.botWelcomeMessage.findMany({
        orderBy: { platform: 'asc' },
      });
      return successResponse(messages);
    } catch {
      return errorResponse('Помилка завантаження привітань', 500);
    }
  }
);

export const POST = withRole('admin', 'manager')(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const msg = await prisma.botWelcomeMessage.create({
        data: {
          platform: body.platform,
          messageText: body.messageText,
          messageImage: body.messageImage || null,
          buttons: body.buttons || null,
          isActive: body.isActive ?? true,
          variant: body.variant || 'A',
        },
      });
      return successResponse(msg, 201);
    } catch {
      return errorResponse('Помилка створення привітання', 500);
    }
  }
);

export const PUT = withRole('admin', 'manager')(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { id, ...data } = body;
      const msg = await prisma.botWelcomeMessage.update({
        where: { id: Number(id) },
        data,
      });
      return successResponse(msg);
    } catch {
      return errorResponse('Помилка оновлення привітання', 500);
    }
  }
);
