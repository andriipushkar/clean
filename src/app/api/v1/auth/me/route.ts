import { withAuth } from '@/middleware/auth';
import { getUserById } from '@/services/auth';
import { successResponse, errorResponse } from '@/utils/api-response';

export const GET = withAuth(async (_request, { user }) => {
  const fullUser = await getUserById(user.id);

  if (!fullUser) {
    return errorResponse('Користувача не знайдено', 404);
  }

  return successResponse({ user: fullUser });
});
