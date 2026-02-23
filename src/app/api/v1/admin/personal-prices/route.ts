import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getPersonalPrices, createPersonalPrice, PersonalPriceError } from '@/services/personal-price';
import { personalPriceFilterSchema, createPersonalPriceSchema } from '@/validators/personal-price';
import { successResponse, errorResponse, paginatedResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(async (request: NextRequest) => {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = personalPriceFilterSchema.safeParse(params);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const { items, total } = await getPersonalPrices(parsed.data);
    return paginatedResponse(items, total, parsed.data.page, parsed.data.limit);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const POST = withRole('admin', 'manager')(async (request: NextRequest, { user }) => {
  try {
    const body = await request.json();
    const parsed = createPersonalPriceSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const item = await createPersonalPrice(parsed.data, user.id);
    return successResponse(item, 201);
  } catch (error) {
    if (error instanceof PersonalPriceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
