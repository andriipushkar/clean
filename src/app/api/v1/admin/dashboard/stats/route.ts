import { withRole } from '@/middleware/auth';
import { getDashboardStats } from '@/services/dashboard';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(async () => {
  try {
    const stats = await getDashboardStats();
    return successResponse(stats);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
