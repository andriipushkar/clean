import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withAuth(async (_request: NextRequest, { user }) => {
  try {
    const count = await prisma.wishlistItem.count({
      where: {
        wishlist: { userId: user.id },
      },
    });
    return successResponse({ count });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
