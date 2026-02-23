import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/middleware/auth';
import { updateAddress, deleteAddress, AddressError } from '@/services/delivery-address';
import { successResponse, errorResponse } from '@/utils/api-response';

const updateAddressSchema = z.object({
  label: z.string().max(50).optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  building: z.string().optional(),
  apartment: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const PUT = withAuth(async (request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    const body = await request.json();
    const parsed = updateAddressSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 422);
    }
    const address = await updateAddress(user.id, Number(id), parsed.data);
    return successResponse(address);
  } catch (error) {
    if (error instanceof AddressError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const DELETE = withAuth(async (_request: NextRequest, { user, params }) => {
  try {
    const { id } = await params!;
    await deleteAddress(user.id, Number(id));
    return successResponse({ message: 'Адресу видалено' });
  } catch (error) {
    if (error instanceof AddressError) return errorResponse(error.message, error.statusCode);
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
