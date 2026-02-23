import { withRole } from '@/middleware/auth';
import { getCustomerSegmentation } from '@/services/analytics-reports';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withRole('admin', 'manager')(async () => {
  try {
    const data = await getCustomerSegmentation();
    return successResponse(data);
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
});
