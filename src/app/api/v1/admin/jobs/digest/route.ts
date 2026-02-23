import { withRole } from '@/middleware/auth';
import { processDigestEmails } from '@/services/jobs/digest';
import { successResponse, errorResponse } from '@/utils/api-response';

export const POST = withRole('admin')(async () => {
  try {
    const result = await processDigestEmails();
    return successResponse(result);
  } catch {
    return errorResponse('Помилка запуску дайджесту', 500);
  }
});
