import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getOrderById } from '@/services/order';
import { addToCart } from '@/services/cart';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const order = await getOrderById(Number(id), user.id);

    if (!order) {
      return errorResponse('Замовлення не знайдено', 404);
    }

    const results = [];
    for (const item of order.items) {
      try {
        if (!item.productId) continue;
        await addToCart(user.id, item.productId, item.quantity);
        results.push({ productId: item.productId, success: true });
      } catch {
        results.push({ productId: item.productId, success: false, name: item.productName });
      }
    }

    const added = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success);

    return successResponse({
      addedCount: added,
      failedItems: failed.map((f) => f.name),
      message: failed.length > 0
        ? `Додано ${added} товарів. ${failed.length} товарів недоступні.`
        : `Додано ${added} товарів до кошика`,
    });
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
