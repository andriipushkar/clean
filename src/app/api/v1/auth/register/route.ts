import { NextRequest } from 'next/server';
import { registerSchema } from '@/validators/auth';
import { registerUser } from '@/services/auth';
import { parseTtlToSeconds } from '@/services/token';
import { AuthError } from '@/services/auth-errors';
import { successResponse, errorResponse } from '@/utils/api-response';
import { serializeRefreshTokenCookie } from '@/utils/cookies';
import { env } from '@/config/env';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Невалідні дані';
      return errorResponse(firstError, 422);
    }

    const { user, tokens } = await registerUser(parsed.data);

    const refreshTtl = parseTtlToSeconds(env.JWT_REFRESH_TTL);
    const response = successResponse(
      { user, accessToken: tokens.accessToken },
      201
    );
    response.headers.set('Set-Cookie', serializeRefreshTokenCookie(tokens.refreshToken, refreshTtl));

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Внутрішня помилка сервера', 500);
  }
}
