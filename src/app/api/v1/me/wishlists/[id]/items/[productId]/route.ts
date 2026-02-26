import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { removeItemFromWishlist, WishlistError } from '@/services/wishlist';
import { successResponse, errorResponse } from '@/utils/api-response';

export const DELETE = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { id, productId } = await params!;
    const numId = Number(id);
    const numProductId = Number(productId);
    if (isNaN(numId) || isNaN(numProductId)) return errorResponse('Невалідний ID', 400);
    await removeItemFromWishlist(user.id, numId, numProductId);
    return successResponse({ message: 'Товар видалено зі списку' });
  } catch (error) {
    if (error instanceof WishlistError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
