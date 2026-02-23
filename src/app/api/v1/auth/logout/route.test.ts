import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockLogoutUser = vi.fn().mockResolvedValue(undefined);
vi.mock('@/services/auth', () => ({
  logoutUser: (...args: unknown[]) => mockLogoutUser(...args),
}));

import { POST } from './route';

function createRequest(accessToken?: string, cookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['authorization'] = `Bearer ${accessToken}`;
  }
  if (cookie) {
    headers['cookie'] = cookie;
  }
  return new NextRequest('http://localhost/api/v1/auth/logout', {
    method: 'POST',
    headers,
  });
}

describe('POST /api/v1/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogoutUser.mockResolvedValue(undefined);
  });

  it('should logout successfully with both tokens', async () => {
    const res = await POST(createRequest('my-access-token', 'refresh_token=my-refresh'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockLogoutUser).toHaveBeenCalledWith('my-access-token', 'my-refresh');
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('should logout with access token only (no refresh cookie)', async () => {
    const res = await POST(createRequest('my-access-token'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockLogoutUser).toHaveBeenCalledWith('my-access-token', undefined);
  });

  it('should return 401 when no access token', async () => {
    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Токен не надано');
  });

  it('should return 500 on service error', async () => {
    mockLogoutUser.mockRejectedValue(new Error('Redis down'));

    const res = await POST(createRequest('token'));

    expect(res.status).toBe(500);
  });
});
