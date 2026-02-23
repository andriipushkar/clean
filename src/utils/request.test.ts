import { describe, it, expect } from 'vitest';
import { getClientIp, getDeviceInfo } from './request';

function createRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost', { headers });
}

describe('request utilities', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const req = createRequest({ 'x-forwarded-for': '203.0.113.1, 70.41.3.18' });
      expect(getClientIp(req)).toBe('203.0.113.1');
    });

    it('should extract single IP from x-forwarded-for', () => {
      const req = createRequest({ 'x-forwarded-for': '10.0.0.1' });
      expect(getClientIp(req)).toBe('10.0.0.1');
    });

    it('should use x-real-ip as fallback', () => {
      const req = createRequest({ 'x-real-ip': '192.168.1.1' });
      expect(getClientIp(req)).toBe('192.168.1.1');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const req = createRequest({
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      });
      expect(getClientIp(req)).toBe('1.1.1.1');
    });

    it('should return 127.0.0.1 when no IP headers present', () => {
      const req = createRequest();
      expect(getClientIp(req)).toBe('127.0.0.1');
    });
  });

  describe('getDeviceInfo', () => {
    it('should return user-agent string', () => {
      const req = createRequest({ 'user-agent': 'Mozilla/5.0 Chrome/120' });
      expect(getDeviceInfo(req)).toBe('Mozilla/5.0 Chrome/120');
    });

    it('should return "unknown" when no user-agent', () => {
      const req = createRequest();
      expect(getDeviceInfo(req)).toBe('unknown');
    });
  });
});
