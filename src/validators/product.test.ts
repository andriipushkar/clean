import { describe, it, expect } from 'vitest';
import { productFilterSchema, createProductSchema, searchAutocompleteSchema } from './product';

describe('productFilterSchema', () => {
  it('should provide defaults for empty params', () => {
    const result = productFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort).toBe('popular');
    }
  });

  it('should parse string numbers', () => {
    const result = productFilterSchema.safeParse({ page: '2', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should reject page < 1', () => {
    const result = productFilterSchema.safeParse({ page: '0' });
    expect(result.success).toBe(false);
  });

  it('should cap limit at 100', () => {
    const result = productFilterSchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });

  it('should accept all valid sort options', () => {
    const sorts = ['popular', 'price_asc', 'price_desc', 'name_asc', 'newest'];
    for (const sort of sorts) {
      const result = productFilterSchema.safeParse({ sort });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid sort option', () => {
    const result = productFilterSchema.safeParse({ sort: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should parse promo and inStock booleans', () => {
    const result = productFilterSchema.safeParse({ promo: 'true', inStock: 'true' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.promo).toBe(true);
      expect(result.data.inStock).toBe(true);
    }
  });
});

describe('createProductSchema', () => {
  it('should accept valid product data', () => {
    const result = createProductSchema.safeParse({
      code: 'BH-001',
      name: 'Порошок пральний 5кг',
      priceRetail: 245.00,
    });
    expect(result.success).toBe(true);
  });

  it('should accept product with all fields', () => {
    const result = createProductSchema.safeParse({
      code: 'BH-001',
      name: 'Порошок пральний 5кг',
      categoryId: 1,
      priceRetail: 245.00,
      priceWholesale: 198.00,
      quantity: 150,
      isPromo: true,
      isActive: true,
      sortOrder: 0,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty code', () => {
    const result = createProductSchema.safeParse({
      code: '',
      name: 'Test',
      priceRetail: 100,
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative price', () => {
    const result = createProductSchema.safeParse({
      code: 'BH-001',
      name: 'Test',
      priceRetail: -10,
    });
    expect(result.success).toBe(false);
  });

  it('should default quantity to 0', () => {
    const result = createProductSchema.safeParse({
      code: 'BH-001',
      name: 'Test',
      priceRetail: 100,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(0);
    }
  });
});

describe('searchAutocompleteSchema', () => {
  it('should accept valid query', () => {
    const result = searchAutocompleteSchema.safeParse({ q: 'порошок' });
    expect(result.success).toBe(true);
  });

  it('should reject query shorter than 2 chars', () => {
    const result = searchAutocompleteSchema.safeParse({ q: 'а' });
    expect(result.success).toBe(false);
  });
});
