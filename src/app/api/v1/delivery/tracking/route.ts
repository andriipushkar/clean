import { NextRequest } from 'next/server';
import { trackParcel as trackNovaPoshta, NovaPoshtaError } from '@/services/nova-poshta';
import { trackParcel as trackUkrposhta, UkrposhtaError } from '@/services/ukrposhta';
import { successResponse, errorResponse } from '@/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const trackingNumber = request.nextUrl.searchParams.get('trackingNumber');
    const provider = request.nextUrl.searchParams.get('provider');

    if (!trackingNumber) {
      return errorResponse('trackingNumber is required', 400);
    }
    if (!provider || !['nova_poshta', 'ukrposhta'].includes(provider)) {
      return errorResponse('provider must be nova_poshta or ukrposhta', 400);
    }

    if (provider === 'nova_poshta') {
      const data = await trackNovaPoshta(trackingNumber);
      return successResponse({ provider, trackingNumber, status: data });
    }

    const data = await trackUkrposhta(trackingNumber);
    return successResponse({ provider, trackingNumber, status: data });
  } catch (error) {
    if (error instanceof NovaPoshtaError || error instanceof UkrposhtaError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
