import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { prisma } from '@/lib/prisma';
import { generateOrderQR, QRCodeError } from '@/services/qr-code';
import { errorResponse } from '@/utils/api-response';

export const GET = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const orderId = Number(id);

    if (isNaN(orderId)) {
      return errorResponse('Невалідний ID замовлення', 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(user.role !== 'admin' && user.role !== 'manager' ? { userId: user.id } : {}),
      },
      select: { orderNumber: true },
    });

    if (!order) {
      return errorResponse('Замовлення не знайдено', 404);
    }

    const buffer = await generateOrderQR(order.orderNumber);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="order-${order.orderNumber}-qr.png"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    if (error instanceof QRCodeError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Помилка генерації QR-коду', 500);
  }
});
