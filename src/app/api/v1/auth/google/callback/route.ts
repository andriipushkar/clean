import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserProfile, GoogleOAuthError } from '@/services/google-oauth';
import { loginWithGoogle } from '@/services/auth';
import { parseTtlToSeconds } from '@/services/token';
import { serializeRefreshTokenCookie } from '@/utils/cookies';
import { env } from '@/config/env';

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${env.APP_URL}/login?error=oauth_denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${env.APP_URL}/login?error=no_code`);
    }

    const tokenData = await exchangeCodeForTokens(code);
    const profile = await getGoogleUserProfile(tokenData.access_token);

    const { tokens } = await loginWithGoogle(
      profile.id,
      profile.email,
      profile.name,
      profile.picture
    );

    // Pass only the short-lived access token in the URL.
    // The refresh token goes in an HTTP-only cookie (never exposed to JS/URL).
    const redirectUrl = new URL('/auth/callback', env.APP_URL);
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);

    const refreshTtl = parseTtlToSeconds(env.JWT_REFRESH_TTL);
    const response = NextResponse.redirect(redirectUrl.toString());
    response.headers.set('Set-Cookie', serializeRefreshTokenCookie(tokens.refreshToken, refreshTtl));

    return response;
  } catch (error) {
    if (error instanceof GoogleOAuthError) {
      return NextResponse.redirect(`${env.APP_URL}/login?error=oauth_failed`);
    }
    return NextResponse.redirect(`${env.APP_URL}/login?error=server_error`);
  }
}
