import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { updatePersonalPrice, deletePersonalPrice, PersonalPriceError } from '@/services/personal-price';
import { updatePersonalPriceSchema } from '@/validators/personal-price';
import { successResponse, errorResponse } from '@/utils/api-response';
import { prisma } from '@/lib/prisma';

export const GET = withRole('admin', 'manager')(async (_request: NextRequest, { params }) => {
  try {
    const { id } = await params!;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    const item = await prisma.personalPrice.findUnique({
      where: { id: numId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        product: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, fullName: true } },
      },
    });

    if (!item) return errorResponse('Не знайдено', 404);
    return successResponse(item);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const PUT = withRole('admin', 'manager')(async (request: NextRequest, { params }) => {
  try {
    const { id } = await params!;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    const body = await request.json();
    const parsed = updatePersonalPriceSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message, 400);
    }

    const item = await updatePersonalPrice(numId, parsed.data);
    return successResponse(item);
  } catch (error) {
    if (error instanceof PersonalPriceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});

export const DELETE = withRole('admin', 'manager')(async (_request: NextRequest, { params }) => {
  try {
    const { id } = await params!;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
    await deletePersonalPrice(numId);
    return successResponse({ deleted: true });
  } catch (error) {
    if (error instanceof PersonalPriceError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
