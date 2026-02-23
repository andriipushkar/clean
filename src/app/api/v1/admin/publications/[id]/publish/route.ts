import { NextRequest } from 'next/server';
import { withRole } from '@/middleware/auth';
import { publishNow, PublicationError } from '@/services/publication';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withRole('admin', 'manager')(async (_request: NextRequest, { params }) => {
  try {
    const { id } = await params!;
    const pub = await publishNow(Number(id));
    return successResponse(pub);
  } catch (error) {
    if (error instanceof PublicationError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
