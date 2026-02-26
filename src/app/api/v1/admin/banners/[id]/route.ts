import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const numId = Number(id);
      if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
      const body = await request.json();

      const banner = await prisma.banner.update({
        where: { id: numId },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.subtitle !== undefined && { subtitle: body.subtitle }),
          ...(body.imageDesktop !== undefined && { imageDesktop: body.imageDesktop }),
          ...(body.imageMobile !== undefined && { imageMobile: body.imageMobile }),
          ...(body.buttonLink !== undefined && { buttonLink: body.buttonLink }),
          ...(body.buttonText !== undefined && { buttonText: body.buttonText }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        },
      });
      return successResponse(banner);
    } catch {
      return errorResponse('Помилка оновлення банера', 500);
    }
  }
);

export const DELETE = withRole('admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const numId = Number(id);
      if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
      await prisma.banner.delete({ where: { id: numId } });
      return successResponse({ deleted: true });
    } catch {
      return errorResponse('Помилка видалення банера', 500);
    }
  }
);
