import { describe, it, expect } from 'vitest';
import { addToCartSchema, updateCartItemSchema, checkoutSchema, orderFilterSchema, updateOrderStatusSchema } from './order';

describe('addToCartSchema', () => {
  it('should accept valid data', () => {
    const result = addToCartSchema.safeParse({ productId: 1, quantity: 3 });
    expect(result.success).toBe(true);
  });

  it('should default quantity to 1', () => {
    const result = addToCartSchema.safeParse({ productId: 5 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.quantity).toBe(1);
  });

  it('should reject non-positive productId', () => {
    expect(addToCartSchema.safeParse({ productId: 0 }).success).toBe(false);
    expect(addToCartSchema.safeParse({ productId: -1 }).success).toBe(false);
  });

  it('should reject quantity less than 1', () => {
    expect(addToCartSchema.safeParse({ productId: 1, quantity: 0 }).success).toBe(false);
  });

  it('should reject non-integer productId', () => {
    expect(addToCartSchema.safeParse({ productId: 1.5 }).success).toBe(false);
  });
});

describe('updateCartItemSchema', () => {
  it('should accept valid quantity', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 5 }).success).toBe(true);
  });

  it('should reject quantity less than 1', () => {
    expect(updateCartItemSchema.safeParse({ quantity: 0 }).success).toBe(false);
  });
});

describe('checkoutSchema', () => {
  const validCheckout = {
    contactName: 'Іван Іваненко',
    contactPhone: '+380501234567',
    contactEmail: 'test@example.com',
    deliveryMethod: 'nova_poshta' as const,
    paymentMethod: 'cod' as const,
  };

  it('should accept valid checkout data', () => {
    const result = checkoutSchema.safeParse(validCheckout);
    expect(result.success).toBe(true);
  });

  it('should reject short contact name', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, contactName: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, contactEmail: 'not-email' });
    expect(result.success).toBe(false);
  });

  it('should reject short phone', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, contactPhone: '123' });
    expect(result.success).toBe(false);
  });

  it('should accept all delivery methods', () => {
    for (const method of ['nova_poshta', 'ukrposhta', 'pickup', 'pallet']) {
      const result = checkoutSchema.safeParse({ ...validCheckout, deliveryMethod: method });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid delivery method', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, deliveryMethod: 'drone' });
    expect(result.success).toBe(false);
  });

  it('should accept all payment methods', () => {
    for (const method of ['cod', 'bank_transfer', 'online', 'card_prepay']) {
      const result = checkoutSchema.safeParse({ ...validCheckout, paymentMethod: method });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid payment method', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, paymentMethod: 'crypto' });
    expect(result.success).toBe(false);
  });

  it('should accept optional fields', () => {
    const result = checkoutSchema.safeParse({
      ...validCheckout,
      companyName: 'Test LLC',
      edrpou: '12345678',
      deliveryCity: 'Київ',
      comment: 'Please deliver ASAP',
    });
    expect(result.success).toBe(true);
  });

  it('should reject EDRPOU with wrong length', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, edrpou: '123' });
    expect(result.success).toBe(false);
  });

  it('should reject comment over 500 chars', () => {
    const result = checkoutSchema.safeParse({ ...validCheckout, comment: 'x'.repeat(501) });
    expect(result.success).toBe(false);
  });
});

describe('orderFilterSchema', () => {
  it('should provide defaults for page and limit', () => {
    const result = orderFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should coerce string numbers', () => {
    const result = orderFilterSchema.safeParse({ page: '3', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(10);
    }
  });

  it('should accept valid status filter', () => {
    const result = orderFilterSchema.safeParse({ status: 'shipped' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = orderFilterSchema.safeParse({ status: 'invalid_status' });
    expect(result.success).toBe(false);
  });

  it('should reject limit over 100', () => {
    const result = orderFilterSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});

describe('updateOrderStatusSchema', () => {
  it('should accept valid status', () => {
    const result = updateOrderStatusSchema.safeParse({ status: 'processing' });
    expect(result.success).toBe(true);
  });

  it('should accept status with comment', () => {
    const result = updateOrderStatusSchema.safeParse({ status: 'shipped', comment: 'TTN: 1234' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = updateOrderStatusSchema.safeParse({ status: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('should reject missing status', () => {
    const result = updateOrderStatusSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should accept all valid order statuses', () => {
    for (const status of ['new_order', 'processing', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled', 'returned']) {
      expect(updateOrderStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });
});
