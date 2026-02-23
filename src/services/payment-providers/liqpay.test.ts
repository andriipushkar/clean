import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';

vi.mock('@/config/env', () => ({
  env: {
    LIQPAY_PUBLIC_KEY: 'sandbox_public',
    LIQPAY_PRIVATE_KEY: 'sandbox_private',
  },
}));

describe('LiqPay provider', () => {
  it('should create payment URL', async () => {
    const { createPayment } = await import('./liqpay');
    const result = await createPayment(
      1, 250.50, 'Test order', 'http://localhost/result', 'http://localhost/callback'
    );
    expect(result.redirectUrl).toContain('https://www.liqpay.ua/api/3/checkout');
    expect(result.redirectUrl).toContain('data=');
    expect(result.redirectUrl).toContain('signature=');
  });

  it('should verify valid callback signature', async () => {
    const { verifyCallback } = await import('./liqpay');

    const payload = {
      action: 'pay',
      status: 'success',
      order_id: 'order_42',
      payment_id: 12345,
      amount: 100,
      currency: 'UAH',
      description: 'Test',
      transaction_id: 67890,
    };

    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signString = 'sandbox_private' + data + 'sandbox_private';
    const signature = crypto.createHash('sha1').update(signString).digest('base64');

    const result = verifyCallback(data, signature);
    expect(result.orderId).toBe(42);
    expect(result.status).toBe('success');
    expect(result.transactionId).toBe('67890');
  });

  it('should reject invalid signature', async () => {
    const { verifyCallback, LiqPayError } = await import('./liqpay');
    const data = Buffer.from(JSON.stringify({ order_id: 'order_1' })).toString('base64');

    expect(() => verifyCallback(data, 'invalid-signature')).toThrow(LiqPayError);
  });
});
