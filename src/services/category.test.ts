import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockPrismaClient } from '@/test/prisma-mock';
import { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, CategoryError } from './category';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/utils/slug', () => ({
  createSlug: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as unknown as MockPrismaClient;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCategories', () => {
  it('should return only visible categories by default', async () => {
    mockPrisma.category.findMany.mockResolvedValue([]);
    await getCategories();
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isVisible: true } })
    );
  });

  it('should include hidden categories when includeHidden is true', async () => {
    mockPrisma.category.findMany.mockResolvedValue([]);
    await getCategories({ includeHidden: true });
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });
});

describe('getCategoryBySlug', () => {
  it('should return category by slug', async () => {
    const mockCategory = { id: 1, name: 'Test', slug: 'test', _count: { products: 5 } };
    mockPrisma.category.findUnique.mockResolvedValue(mockCategory as never);
    const result = await getCategoryBySlug('test');
    expect(result).toEqual(mockCategory);
  });

  it('should return null for non-existent slug', async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null);
    const result = await getCategoryBySlug('nonexistent');
    expect(result).toBeNull();
  });
});

describe('createCategory', () => {
  it('should create a category with auto-generated slug', async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null);
    const created = { id: 1, name: 'Пральні засоби', slug: 'pralni-zasoby' };
    mockPrisma.category.create.mockResolvedValue(created as never);

    await createCategory({ name: 'Пральні засоби' });
    expect(mockPrisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'Пральні засоби' }),
      })
    );
  });

  it('should throw 409 if slug already exists', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({ id: 1 } as never);
    await expect(createCategory({ name: 'Test' })).rejects.toThrow(CategoryError);
  });

  it('should throw 404 if parent category not found', async () => {
    mockPrisma.category.findUnique
      .mockResolvedValueOnce(null) // slug check
      .mockResolvedValueOnce(null); // parent check
    await expect(createCategory({ name: 'Test', parentId: 999 })).rejects.toThrow(CategoryError);
  });
});

describe('updateCategory', () => {
  it('should throw 404 if category not found', async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null);
    await expect(updateCategory(999, { name: 'New Name' })).rejects.toThrow(CategoryError);
  });

  it('should throw 400 if category is its own parent', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({ id: 1, slug: 'test' } as never);
    await expect(updateCategory(1, { parentId: 1 })).rejects.toThrow(CategoryError);
  });
});

describe('deleteCategory', () => {
  it('should throw 404 if category not found', async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null);
    await expect(deleteCategory(999)).rejects.toThrow(CategoryError);
  });

  it('should throw 400 if category has products', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({
      id: 1,
      _count: { products: 5 },
    } as never);
    await expect(deleteCategory(1)).rejects.toThrow(CategoryError);
  });

  it('should delete category with no products', async () => {
    mockPrisma.category.findUnique.mockResolvedValue({
      id: 1,
      _count: { products: 0 },
    } as never);
    mockPrisma.category.delete.mockResolvedValue({} as never);
    await deleteCategory(1);
    expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
