import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { updatePublication, deletePublication, PublicationError } from '@/services/publication';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const numId = Number(id);
      if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
      const body = await request.json();
      const pub = await updatePublication(numId, body);
      return successResponse(pub);
    } catch (error) {
      if (error instanceof PublicationError) return errorResponse(error.message, error.statusCode);
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);

export const DELETE = withRole('admin')(
  async (_request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const numId = Number(id);
      if (isNaN(numId)) return errorResponse('Невалідний ID', 400);
      await deletePublication(numId);
      return successResponse({ deleted: true });
    } catch (error) {
      if (error instanceof PublicationError) return errorResponse(error.message, error.statusCode);
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
