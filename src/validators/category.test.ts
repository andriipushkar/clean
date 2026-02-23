import { describe, it, expect } from 'vitest';
import { createCategorySchema, updateCategorySchema } from './category';

describe('createCategorySchema', () => {
  it('should accept valid category data', () => {
    const result = createCategorySchema.safeParse({
      name: 'Пральні засоби',
      description: 'Опис категорії',
    });
    expect(result.success).toBe(true);
  });

  it('should accept category with all optional fields', () => {
    const result = createCategorySchema.safeParse({
      name: 'Пральні засоби',
      slug: 'pralni-zasoby',
      description: 'Опис',
      iconPath: '/icons/wash.svg',
      seoTitle: 'SEO Title',
      seoDescription: 'SEO Description',
      sortOrder: 1,
      isVisible: true,
      parentId: null,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = createCategorySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject name shorter than 2 chars', () => {
    const result = createCategorySchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid slug format', () => {
    const result = createCategorySchema.safeParse({ name: 'Test', slug: 'INVALID SLUG!' });
    expect(result.success).toBe(false);
  });

  it('should accept valid slug format', () => {
    const result = createCategorySchema.safeParse({ name: 'Test', slug: 'valid-slug-123' });
    expect(result.success).toBe(true);
  });
});

describe('updateCategorySchema', () => {
  it('should accept partial update with just name', () => {
    const result = updateCategorySchema.safeParse({ name: 'Нова назва' });
    expect(result.success).toBe(true);
  });

  it('should accept empty object (no changes)', () => {
    const result = updateCategorySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
