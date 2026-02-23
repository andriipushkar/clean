import { NextResponse } from 'next/server';
import { getGoogleAuthUrl, GoogleOAuthError } from '@/services/google-oauth';
import { errorResponse } from '@/utils/api-response';

export async function GET() {
  try {
    const url = getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof GoogleOAuthError) {
      return errorResponse(error.message, error.statusCode);
    }
    return errorResponse('Помилка Google OAuth', 500);
  }
}
