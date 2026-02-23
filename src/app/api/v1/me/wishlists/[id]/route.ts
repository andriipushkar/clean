import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { z } from 'zod';
import { getWishlistById, updateWishlist, deleteWishlist, WishlistError } from '@/services/wishlist';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const wishlist = await getWishlistById(user.id, Number(id));
    return successResponse(wishlist);
  } catch (error) {
    if (error instanceof WishlistError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

const updateSchema = z.object({ name: z.string().min(1).max(100) });

export const PUT = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Невалідні дані', 422);
    }

    const wishlist = await updateWishlist(user.id, Number(id), parsed.data.name);
    return successResponse(wishlist);
  } catch (error) {
    if (error instanceof WishlistError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const DELETE = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    await deleteWishlist(user.id, Number(id));
    return successResponse({ message: 'Список видалено' });
  } catch (error) {
    if (error instanceof WishlistError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
