import { describe, it, expect, vi } from 'vitest';
import {
  serializeRefreshTokenCookie,
  serializeClearRefreshTokenCookie,
  getRefreshTokenFromCookies,
} from './cookies';

describe('cookie utilities', () => {
  describe('serializeRefreshTokenCookie', () => {
    it('should serialize a refresh token cookie', () => {
      const cookie = serializeRefreshTokenCookie('my-token', 2592000);

      expect(cookie).toContain('refresh_token=my-token');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/api/v1/auth');
      expect(cookie).toContain('Max-Age=2592000');
    });

    it('should not include Secure flag in non-production', () => {
      vi.stubEnv('NODE_ENV', 'test');
      const cookie = serializeRefreshTokenCookie('token', 3600);
      expect(cookie).not.toContain('Secure');
    });

    it('should include Secure flag in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const cookie = serializeRefreshTokenCookie('token', 3600);
      expect(cookie).toContain('Secure');
      vi.stubEnv('NODE_ENV', 'test');
    });
  });

  describe('serializeClearRefreshTokenCookie', () => {
    it('should serialize a clear cookie with empty value and maxAge=0', () => {
      const cookie = serializeClearRefreshTokenCookie();

      expect(cookie).toContain('refresh_token=');
      expect(cookie).toContain('Max-Age=0');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/api/v1/auth');
    });
  });

  describe('getRefreshTokenFromCookies', () => {
    it('should extract refresh token from cookie header', () => {
      const result = getRefreshTokenFromCookies('refresh_token=my-jwt-token; other=val');
      expect(result).toBe('my-jwt-token');
    });

    it('should return null if no cookie header', () => {
      expect(getRefreshTokenFromCookies(null)).toBeNull();
    });

    it('should return null if refresh_token not present', () => {
      expect(getRefreshTokenFromCookies('session=abc; other=123')).toBeNull();
    });

    it('should handle URL-encoded values', () => {
      const result = getRefreshTokenFromCookies('refresh_token=abc%3Ddef');
      expect(result).toBe('abc=def');
    });

    it('should handle cookie with only refresh_token', () => {
      const result = getRefreshTokenFromCookies('refresh_token=solo-token');
      expect(result).toBe('solo-token');
    });
  });
});
