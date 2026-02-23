import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { updateCartItem, removeFromCart, CartError } from '@/services/cart';
import { updateCartItemSchema } from '@/validators/order';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { productId } = await params!;
    const body = await request.json();
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }
    const item = await updateCartItem(user.id, Number(productId), parsed.data.quantity);
    return successResponse(item);
  } catch (error) {
    if (error instanceof CartError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const DELETE = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { productId } = await params!;
    await removeFromCart(user.id, Number(productId));
    return successResponse({ message: 'Видалено' });
  } catch (error) {
    if (error instanceof CartError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
