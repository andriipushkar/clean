import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(
  async () => {
    try {
      const badges = await prisma.productBadge.findMany({
        include: {
          product: { select: { id: true, name: true, code: true } },
        },
        orderBy: { priority: 'asc' },
      });
      return successResponse(badges);
    } catch {
      return errorResponse('Помилка завантаження бейджів', 500);
    }
  }
);

export const POST = withRole('admin', 'manager')(
  async (request: NextRequest) => {
    try {
      const body = await request.json();

      if (!body.productId || !body.badgeType) {
        return errorResponse('productId та badgeType обов\'язкові', 400);
      }

      const badge = await prisma.productBadge.create({
        data: {
          productId: Number(body.productId),
          badgeType: body.badgeType,
          customText: body.customText || null,
          customColor: body.customColor || null,
          priority: body.priority ?? 0,
          isActive: body.isActive ?? true,
        },
      });
      return successResponse(badge, 201);
    } catch {
      return errorResponse('Помилка створення бейджа', 500);
    }
  }
);
