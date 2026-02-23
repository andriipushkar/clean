import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getGoogleUserProfile, GoogleOAuthError } from '@/services/google-oauth';
import { loginWithGoogle } from '@/services/auth';
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

    const redirectUrl = new URL('/auth/callback', env.APP_URL);
    redirectUrl.searchParams.set('accessToken', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    if (error instanceof GoogleOAuthError) {
      return NextResponse.redirect(`${env.APP_URL}/login?error=oauth_failed`);
    }
    return NextResponse.redirect(`${env.APP_URL}/login?error=server_error`);
  }
}
