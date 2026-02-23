import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { getPalletConfig, updatePalletConfig, PalletDeliveryError } from '@/services/pallet-delivery';
import { palletConfigSchema } from '@/validators/pallet-delivery';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin')(async () => {
  try {
    const config = await getPalletConfig();
    return successResponse(config);
  } catch {
    return errorResponse('Помилка завантаження конфігурації', 500);
  }
});

export const PUT = withRole('admin')(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const parsed = palletConfigSchema.partial().safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || 'Невірні дані', 400);
    }

    const userId = (request as unknown as { user?: { id: number } }).user?.id;
    const config = await updatePalletConfig(parsed.data, userId);
    return successResponse(config);
  } catch (error) {
    if (error instanceof PalletDeliveryError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Помилка збереження конфігурації', 500);
  }
});
