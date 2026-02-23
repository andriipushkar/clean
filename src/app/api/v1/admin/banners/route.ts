import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(
  async () => {
    try {
      const banners = await prisma.banner.findMany({
        orderBy: { sortOrder: 'asc' },
      });
      return successResponse(banners);
    } catch {
      return errorResponse('Помилка завантаження банерів', 500);
    }
  }
);

export const POST = withRole('admin', 'manager')(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const maxOrder = await prisma.banner.aggregate({ _max: { sortOrder: true } });

      const banner = await prisma.banner.create({
        data: {
          title: body.title || null,
          subtitle: body.subtitle || null,
          imageDesktop: body.imageDesktop || '',
          imageMobile: body.imageMobile || null,
          buttonLink: body.buttonLink || null,
          buttonText: body.buttonText || null,
          isActive: body.isActive ?? true,
          sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        },
      });
      return successResponse(banner, 201);
    } catch {
      return errorResponse('Помилка створення банера', 500);
    }
  }
);
