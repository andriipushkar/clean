import { NextRequest } from 'next/server';
import { searchCities, NovaPoshtaError } from '@/services/nova-poshta';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q');
    if (!query || query.length < 2) {
      return errorResponse('Параметр q обов\'язковий (мін. 2 символи)', 400);
    }

    const cities = await searchCities(query);
    return successResponse(cities);
  } catch (error) {
    if (error instanceof NovaPoshtaError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Помилка пошуку міст', 500);
  }
}
