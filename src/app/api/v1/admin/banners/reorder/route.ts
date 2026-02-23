import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { orderedIds } = body;

      if (!Array.isArray(orderedIds)) {
        return errorResponse('orderedIds є обовʼязковим масивом', 400);
      }

      await prisma.$transaction(
        orderedIds.map((id: number, index: number) =>
          prisma.banner.update({
            where: { id },
            data: { sortOrder: index },
          })
        )
      );

      return successResponse({ reordered: true });
    } catch {
      return errorResponse('Помилка зміни порядку', 500);
    }
  }
);
