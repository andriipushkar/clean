import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { updatePublication, deletePublication, PublicationError } from '@/services/publication';
import { successResponse, errorResponse } from '@/utils/api-response';

export const PUT = withRole('admin', 'manager')(
  async (request: NextRequest, { params }) => {
    try {
      const { id } = await params!;
      const body = await request.json();
      const pub = await updatePublication(Number(id), body);
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
      await deletePublication(Number(id));
      return successResponse({ deleted: true });
    } catch (error) {
      if (error instanceof PublicationError) return errorResponse(error.message, error.statusCode);
      return errorResponse('Внутрішня помилка сервера', 500);
    }
  }
);
