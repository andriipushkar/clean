import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn(), update: vi.fn() },
    payment: { findUnique: vi.fn(), upsert: vi.fn(), create: vi.fn(), update: vi.fn() },
  },
}));

vi.mock('@/config/env', () => ({
  env: {
    APP_URL: 'http://localhost:3000',
    LIQPAY_PUBLIC_KEY: 'test_public',
    LIQPAY_PRIVATE_KEY: 'test_private',
    MONOBANK_TOKEN: 'test_token',
  },
}));

vi.mock('./payment-providers/liqpay', () => ({
  createPayment: vi.fn().mockResolvedValue({ redirectUrl: 'https://liqpay.ua/checkout' }),
}));

vi.mock('./payment-providers/monobank', () => ({
  createPayment: vi.fn().mockResolvedValue({ redirectUrl: 'https://pay.monobank.ua/xxx', paymentId: 'inv123' }),
}));

describe('payment service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if order not found', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const { initiatePayment, PaymentError } = await import('./payment');
    await expect(initiatePayment(999, 'liqpay')).rejects.toThrow(PaymentError);
  });

  it('should throw if payment method is not online', async () => {
    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 1,
      orderNumber: '20240115-0001',
      totalAmount: 100,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      payment: null,
    } as never);

    const { initiatePayment, PaymentError } = await import('./payment');
    await expect(initiatePayment(1, 'liqpay')).rejects.toThrow(PaymentError);
  });
});
