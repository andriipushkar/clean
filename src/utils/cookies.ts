import { serialize } from 'cookie';

const REFRESH_COOKIE_NAME = 'refresh_token';
const COOKIE_PATH = '/api/v1/auth';

export function serializeRefreshTokenCookie(token: string, maxAgeSeconds: number): string {
  return serialize(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: maxAgeSeconds,
  });
}

export function serializeClearRefreshTokenCookie(): string {
  return serialize(REFRESH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: 0,
  });
}

export function getRefreshTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split('=');
    if (name === REFRESH_COOKIE_NAME) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return null;
}
