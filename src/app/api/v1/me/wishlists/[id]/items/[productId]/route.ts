import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { removeItemFromWishlist, WishlistError } from '@/services/wishlist';
import { successResponse, errorResponse } from '@/utils/api-response';

export const DELETE = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { id, productId } = await params!;
    await removeItemFromWishlist(user.id, Number(id), Number(productId));
    return successResponse({ message: 'Товар видалено зі списку' });
  } catch (error) {
    if (error instanceof WishlistError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
