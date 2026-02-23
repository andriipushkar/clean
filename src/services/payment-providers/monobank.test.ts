import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/config/env', () => ({
  env: { MONOBANK_TOKEN: 'test-mono-token' },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Monobank provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create invoice', async () => {
    const { createPayment } = await import('./monobank');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        invoiceId: 'inv_123',
        pageUrl: 'https://pay.monobank.ua/inv_123',
      }),
    });

    const result = await createPayment(
      1, 500, 'Test', 'http://localhost/result', 'http://localhost/webhook'
    );

    expect(result.redirectUrl).toBe('https://pay.monobank.ua/inv_123');
    expect(result.paymentId).toBe('inv_123');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.monobank.ua/api/merchant/invoice/create',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'X-Token': 'test-mono-token' }),
      })
    );

    // Verify amount is in kopecks
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.amount).toBe(50000);
    expect(callBody.ccy).toBe(980);
  });

  it('should throw on API error', async () => {
    const { createPayment, MonobankError } = await import('./monobank');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ errText: 'Bad request' }),
    });

    await expect(
      createPayment(1, 100, 'Test', 'http://localhost', 'http://localhost')
    ).rejects.toThrow(MonobankError);
  });
});
