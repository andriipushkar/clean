import { NextRequest } from 'next/server';
import { searchAutocompleteSchema } from '@/validators/product';
import { searchAutocomplete } from '@/services/product';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') ?? '';
    const parsed = searchAutocompleteSchema.safeParse({ q });

    if (!parsed.success) {
      return errorResponse('Запит має містити щонайменше 2 символи', 422);
    }

    const results = await searchAutocomplete(parsed.data.q);
    return successResponse(results);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
