import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    NOVA_POSHTA_API_KEY: 'test-np-key',
    LIQPAY_PUBLIC_KEY: 'test-liqpay-key',
    SMTP_HOST: 'smtp.test.com',
    SMTP_USER: 'user@test.com',
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock dns
vi.mock('dns', () => ({
  promises: {
    resolve: vi.fn().mockResolvedValue(['127.0.0.1']),
  },
}));

import { runHealthChecks } from './health-check';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('runHealthChecks', () => {
  it('should return OK for all services when they respond', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await runHealthChecks();

    expect(result.results).toHaveLength(3);
    expect(result.results[0].service).toBe('nova_poshta');
    expect(result.results[0].status).toBe('ok');
    expect(result.results[1].service).toBe('liqpay');
    expect(result.results[2].service).toBe('smtp');
    expect(result.allHealthy).toBe(true);
  });

  it('should report error when a service fails', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 }) // Nova Poshta fails
      .mockResolvedValueOnce({ ok: true, status: 200 }); // LiqPay ok

    const result = await runHealthChecks();

    expect(result.results[0].status).toBe('error');
    expect(result.allHealthy).toBe(false);
  });

  it('should include latency for each check', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const result = await runHealthChecks();

    for (const r of result.results) {
      expect(r.latencyMs).toBeGreaterThanOrEqual(0);
    }
  });
});
