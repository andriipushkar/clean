import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return errorResponse('Товар не знайдено', 404);
    }

    const history = await prisma.priceHistory.findMany({
      where: { productId: product.id },
      orderBy: { changedAt: 'asc' },
      select: {
        id: true,
        priceRetailOld: true,
        priceRetailNew: true,
        priceWholesaleOld: true,
        priceWholesaleNew: true,
        changedAt: true,
      },
    });

    return successResponse(history);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
