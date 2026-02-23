import { NextRequest } from 'next/server';
import { productFilterSchema } from '@/validators/product';
import { getProducts } from '@/services/product';
import { paginatedResponse, errorResponse } from '@/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const raw = {
      page: sp.get('page') ?? undefined,
      limit: sp.get('limit') ?? undefined,
      category: sp.get('category') ?? undefined,
      search: sp.get('search') ?? undefined,
      priceMin: sp.get('price_min') ?? undefined,
      priceMax: sp.get('price_max') ?? undefined,
      promo: sp.get('promo') ?? undefined,
      inStock: sp.get('in_stock') ?? undefined,
      sort: sp.get('sort') ?? undefined,
    };

    const parsed = productFilterSchema.safeParse(raw);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Невалідні параметри';
      return errorResponse(firstError, 422);
    }

    const { products, total } = await getProducts(parsed.data);
    return paginatedResponse(products, total, parsed.data.page, parsed.data.limit);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
