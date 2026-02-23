import { NextRequest } from 'next/server';
import { logoutUser } from '@/services/auth';
import { errorResponse, successResponse } from '@/utils/api-response';
import { getRefreshTokenFromCookies, serializeClearRefreshTokenCookie } from '@/utils/cookies';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!accessToken) {
      return errorResponse('Токен не надано', 401);
    }

    const cookieHeader = request.headers.get('cookie');
    const refreshToken = getRefreshTokenFromCookies(cookieHeader) || undefined;

    await logoutUser(accessToken, refreshToken);

    const response = successResponse({ message: 'Вихід виконано' });
    response.headers.set('Set-Cookie', serializeClearRefreshTokenCookie());

    return response;
  } catch {
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
