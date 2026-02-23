import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendOrderConfirmation,
  sendOrderStatusChanged,
  sendWelcomeEmail,
  sendWholesaleApproved,
} from './email-template';

const mockSendEmail = vi.fn().mockResolvedValue(undefined);

vi.mock('./email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock('@/config/env', () => ({
  env: {
    APP_URL: 'http://localhost:3000',
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendOrderConfirmation', () => {
  it('should send email with correct subject and content', async () => {
    await sendOrderConfirmation({
      to: 'user@test.com',
      name: 'Іван',
      orderNumber: 'ORD-001',
      items: [{ name: 'Засіб для миття', quantity: 2, price: 150 }],
      total: 300,
      deliveryMethod: 'Нова Пошта',
    });

    expect(mockSendEmail).toHaveBeenCalledOnce();
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe('user@test.com');
    expect(call.subject).toContain('ORD-001');
    expect(call.html).toContain('Іван');
    expect(call.html).toContain('ORD-001');
    expect(call.html).toContain('Засіб для миття');
    expect(call.html).toContain('300.00 ₴');
    expect(call.html).toContain('Нова Пошта');
  });

  it('should include all items in email', async () => {
    await sendOrderConfirmation({
      to: 'user@test.com',
      name: 'Тест',
      orderNumber: 'ORD-002',
      items: [
        { name: 'Item A', quantity: 1, price: 100 },
        { name: 'Item B', quantity: 3, price: 50 },
      ],
      total: 250,
      deliveryMethod: 'Самовивіз',
    });

    const html = mockSendEmail.mock.calls[0][0].html;
    expect(html).toContain('Item A');
    expect(html).toContain('Item B');
  });
});

describe('sendOrderStatusChanged', () => {
  it('should send status change email', async () => {
    await sendOrderStatusChanged({
      to: 'user@test.com',
      name: 'Олена',
      orderNumber: 'ORD-003',
      newStatus: 'Відправлене',
      orderId: 42,
    });

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).toContain('ORD-003');
    expect(call.subject).toContain('Відправлене');
    expect(call.html).toContain('Відправлене');
    expect(call.html).toContain('/account/orders/42');
  });

  it('should include tracking number when provided', async () => {
    await sendOrderStatusChanged({
      to: 'user@test.com',
      name: 'Тест',
      orderNumber: 'ORD-004',
      newStatus: 'Відправлене',
      trackingNumber: '20450000001234',
      orderId: 1,
    });

    const html = mockSendEmail.mock.calls[0][0].html;
    expect(html).toContain('20450000001234');
  });

  it('should include comment when provided', async () => {
    await sendOrderStatusChanged({
      to: 'user@test.com',
      name: 'Тест',
      orderNumber: 'ORD-005',
      newStatus: 'В обробці',
      comment: 'Чекаємо оплату',
      orderId: 2,
    });

    const html = mockSendEmail.mock.calls[0][0].html;
    expect(html).toContain('Чекаємо оплату');
  });
});

describe('sendWelcomeEmail', () => {
  it('should send welcome email with name', async () => {
    await sendWelcomeEmail({ to: 'new@test.com', name: 'Марія' });

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe('new@test.com');
    expect(call.subject).toContain('Ласкаво просимо');
    expect(call.html).toContain('Марія');
    expect(call.html).toContain('/catalog');
  });
});

describe('sendWholesaleApproved', () => {
  it('should send wholesale approval email', async () => {
    await sendWholesaleApproved({
      to: 'company@test.com',
      companyName: 'ТОВ Клін',
    });

    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).toContain('Оптовий статус');
    expect(call.html).toContain('ТОВ Клін');
  });

  it('should include manager info when provided', async () => {
    await sendWholesaleApproved({
      to: 'company@test.com',
      companyName: 'ТОВ Клін',
      managerName: 'Олексій Менеджер',
      managerPhone: '+380991234567',
    });

    const html = mockSendEmail.mock.calls[0][0].html;
    expect(html).toContain('Олексій Менеджер');
    expect(html).toContain('+380991234567');
  });
});
