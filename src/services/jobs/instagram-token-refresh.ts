import { env } from '@/config/env';

/**
 * Refresh Instagram long-lived access token.
 * Should be called before the token expires (every ~50 days).
 */
export async function refreshInstagramToken(): Promise<{
  refreshed: boolean;
  newToken?: string;
  expiresIn?: number;
  error?: string;
}> {
  if (!env.INSTAGRAM_ACCESS_TOKEN) {
    return { refreshed: false, error: 'Instagram access token not configured' };
  }

  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${env.INSTAGRAM_ACCESS_TOKEN}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const body = await res.text();
      return { refreshed: false, error: `Instagram API error: ${res.status} ${body}` };
    }

    const data = await res.json() as { access_token: string; token_type: string; expires_in: number };

    // Note: In production, you would save the new token to environment/config storage
    return {
      refreshed: true,
      newToken: data.access_token.slice(0, 10) + '...',
      expiresIn: data.expires_in,
    };
  } catch (err) {
    return {
      refreshed: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
