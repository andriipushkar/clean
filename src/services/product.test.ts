import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ProductError,
  getProductBySlug,
  getProductById,
  searchAutocomplete,
  createProduct,
  updateProduct,
  deleteProduct,
  getPromoProducts,
  getNewProducts,
  getPopularProducts,
} from './product';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    priceHistory: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

vi.mock('@/utils/slug', () => ({
  createSlug: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
}));

vi.mock('@/services/personal-price', () => ({
  getEffectivePrice: vi.fn(),
}));

import { prisma } from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// ProductError
// ---------------------------------------------------------------------------
describe('ProductError', () => {
  it('should create an error with message and statusCode', () => {
    const error = new ProductError('Товар не знайдено', 404);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ProductError);
    expect(error.message).toBe('Товар не знайдено');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('ProductError');
  });

  it('should support different status codes', () => {
    const error = new ProductError('Товар з таким кодом вже існує', 409);
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Товар з таким кодом вже існує');
  });
});

// ---------------------------------------------------------------------------
// getProductBySlug
// ---------------------------------------------------------------------------
describe('getProductBySlug', () => {
  it('should return product with personalPrice when found', async () => {
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      slug: 'test-product',
      priceRetail: 100,
      categoryId: 2,
      category: { id: 2, name: 'Cat', slug: 'cat' },
    };
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct as never);
    mockPrisma.product.update.mockResolvedValue({} as never);

    const result = await getProductBySlug('test-product');

    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.slug).toBe('test-product');
    expect(result!.personalPrice).toBeNull();
    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'test-product', isActive: true },
      })
    );
  });

  it('should increment view count asynchronously', async () => {
    const mockProduct = { id: 5, slug: 'item', priceRetail: 50, categoryId: null };
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct as never);
    mockPrisma.product.update.mockResolvedValue({} as never);

    await getProductBySlug('item');

    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { viewsCount: { increment: 1 } },
    });
  });

  it('should return null when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);

    const result = await getProductBySlug('nonexistent');

    expect(result).toBeNull();
    expect(mockPrisma.product.update).not.toHaveBeenCalled();
  });

  it('should apply personal pricing when userId is provided', async () => {
    const { getEffectivePrice } = await import('@/services/personal-price');
    vi.mocked(getEffectivePrice).mockResolvedValue({
      fixedPrice: 80,
      discountPercent: null,
    } as never);

    const mockProduct = {
      id: 1,
      slug: 'test',
      priceRetail: 100,
      categoryId: 3,
      category: { id: 3 },
    };
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct as never);
    mockPrisma.product.update.mockResolvedValue({} as never);

    const result = await getProductBySlug('test', 42);

    expect(result).not.toBeNull();
    expect(result!.personalPrice).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// getProductById
// ---------------------------------------------------------------------------
describe('getProductById', () => {
  it('should return product when found', async () => {
    const mockProduct = {
      id: 10,
      name: 'Product Ten',
      priceRetail: 200,
      categoryId: null,
    };
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct as never);

    const result = await getProductById(10);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(10);
    expect(result!.personalPrice).toBeNull();
    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10 } })
    );
  });

  it('should return null when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);

    const result = await getProductById(999);

    expect(result).toBeNull();
  });

  it('should apply personal pricing with discount percent', async () => {
    const { getEffectivePrice } = await import('@/services/personal-price');
    vi.mocked(getEffectivePrice).mockResolvedValue({
      fixedPrice: null,
      discountPercent: 10,
    } as never);

    const mockProduct = {
      id: 1,
      priceRetail: 200,
      categoryId: 5,
      category: { id: 5 },
    };
    mockPrisma.product.findUnique.mockResolvedValue(mockProduct as never);

    const result = await getProductById(1, 7);

    expect(result).not.toBeNull();
    // 200 * (1 - 10/100) = 180
    expect(result!.personalPrice).toBe(180);
  });
});

// ---------------------------------------------------------------------------
// searchAutocomplete
// ---------------------------------------------------------------------------
describe('searchAutocomplete', () => {
  it('should return products and categories matching query', async () => {
    const mockProductIds = [{ id: 1 }, { id: 2 }];
    mockPrisma.$queryRaw.mockResolvedValue(mockProductIds as never);

    const mockProducts = [
      { id: 1, name: 'Soap A', slug: 'soap-a', code: 'S001', priceRetail: 50, images: [] },
      { id: 2, name: 'Soap B', slug: 'soap-b', code: 'S002', priceRetail: 60, images: [] },
    ];
    mockPrisma.product.findMany.mockResolvedValue(mockProducts as never);

    const mockCategories = [
      { id: 10, name: 'Soaps', slug: 'soaps', _count: { products: 15 } },
    ];
    (mockPrisma as never as { category: { findMany: ReturnType<typeof vi.fn> } }).category.findMany.mockResolvedValue(mockCategories as never);

    const result = await searchAutocomplete('soap');

    expect(result.products).toHaveLength(2);
    expect(result.categories).toHaveLength(1);
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
  });

  it('should return empty products when no ids matched', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([] as never);
    (mockPrisma as never as { category: { findMany: ReturnType<typeof vi.fn> } }).category.findMany.mockResolvedValue([] as never);

    const result = await searchAutocomplete('zzzzz');

    expect(result.products).toEqual([]);
    expect(result.categories).toEqual([]);
    // findMany for products should not be called when no ids
    expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------
describe('createProduct', () => {
  it('should create product with generated slug', async () => {
    // No existing product with same code
    mockPrisma.product.findUnique
      .mockResolvedValueOnce(null) // code check
      .mockResolvedValueOnce(null); // slug check

    const created = {
      id: 1,
      code: 'P001',
      name: 'New Product',
      slug: 'new-product',
      priceRetail: 150,
    };
    mockPrisma.product.create.mockResolvedValue(created as never);

    const result = await createProduct({
      code: 'P001',
      name: 'New Product',
      priceRetail: 150,
    });

    expect(result).toEqual(created);
    expect(mockPrisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: 'P001',
          name: 'New Product',
          slug: 'new-product',
          priceRetail: 150,
        }),
      })
    );
  });

  it('should append code to slug when slug already exists', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce(null) // code check
      .mockResolvedValueOnce({ id: 99 } as never); // slug exists

    mockPrisma.product.create.mockResolvedValue({ id: 2 } as never);

    await createProduct({
      code: 'P002',
      name: 'New Product',
      priceRetail: 100,
    });

    expect(mockPrisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: 'new-product-p002',
        }),
      })
    );
  });

  it('should throw 409 if product code already exists', async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce({ id: 1 } as never);

    await expect(
      createProduct({ code: 'P001', name: 'Dup', priceRetail: 100 })
    ).rejects.toThrow(ProductError);

    await expect(
      createProduct({ code: 'P001', name: 'Dup', priceRetail: 100 })
    ).rejects.toThrow('Товар з таким кодом вже існує');
  });

  it('should throw 404 if category not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValueOnce(null); // code check
    (mockPrisma as never as { category: { findUnique: ReturnType<typeof vi.fn> } }).category.findUnique.mockResolvedValue(null);

    await expect(
      createProduct({ code: 'P003', name: 'Test', priceRetail: 100, categoryId: 999 })
    ).rejects.toThrow(ProductError);
  });

  it('should create product with all optional fields', async () => {
    mockPrisma.product.findUnique
      .mockResolvedValueOnce(null) // code check
      .mockResolvedValueOnce(null); // slug check
    (mockPrisma as never as { category: { findUnique: ReturnType<typeof vi.fn> } }).category.findUnique.mockResolvedValue({ id: 1 } as never);
    mockPrisma.product.create.mockResolvedValue({ id: 3 } as never);

    await createProduct({
      code: 'P004',
      name: 'Full Product',
      priceRetail: 200,
      priceWholesale: 150,
      categoryId: 1,
      quantity: 50,
      isPromo: true,
      isActive: true,
      sortOrder: 5,
    });

    expect(mockPrisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          priceWholesale: 150,
          quantity: 50,
          isPromo: true,
          isActive: true,
          sortOrder: 5,
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------
describe('updateProduct', () => {
  it('should update product successfully', async () => {
    const existing = {
      id: 1,
      code: 'P001',
      name: 'Old Name',
      priceRetail: 100,
      priceWholesale: 80,
    };
    mockPrisma.product.findUnique.mockResolvedValue(existing as never);
    mockPrisma.product.update.mockResolvedValue({ id: 1, quantity: 25 } as never);

    const result = await updateProduct(1, { quantity: 25 });

    expect(result).toEqual({ id: 1, quantity: 25 });
    expect(mockPrisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ quantity: 25 }),
      })
    );
  });

  it('should throw 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);

    await expect(updateProduct(999, { name: 'X' })).rejects.toThrow(ProductError);
    await expect(updateProduct(999, { name: 'X' })).rejects.toThrow('Товар не знайдено');
  });

  it('should track price history when retail price changes', async () => {
    const existing = {
      id: 1,
      code: 'P001',
      name: 'Product',
      priceRetail: 100,
      priceWholesale: 80,
    };
    mockPrisma.product.findUnique.mockResolvedValue(existing as never);
    mockPrisma.priceHistory.create.mockResolvedValue({} as never);
    mockPrisma.product.update.mockResolvedValue({ id: 1 } as never);

    await updateProduct(1, { priceRetail: 120 });

    expect(mockPrisma.priceHistory.create).toHaveBeenCalledWith({
      data: {
        productId: 1,
        priceRetailOld: 100,
        priceRetailNew: 120,
        priceWholesaleOld: 80,
        priceWholesaleNew: 80,
      },
    });
  });

  it('should not create price history when price stays the same', async () => {
    const existing = {
      id: 1,
      code: 'P001',
      name: 'Product',
      priceRetail: 100,
      priceWholesale: 80,
    };
    mockPrisma.product.findUnique.mockResolvedValue(existing as never);
    mockPrisma.product.update.mockResolvedValue({ id: 1 } as never);

    await updateProduct(1, { priceRetail: 100 });

    expect(mockPrisma.priceHistory.create).not.toHaveBeenCalled();
  });

  it('should throw 409 if updated code conflicts with another product', async () => {
    const existing = { id: 1, code: 'P001', priceRetail: 100, priceWholesale: 80 };
    mockPrisma.product.findUnique
      .mockResolvedValueOnce(existing as never) // find existing
      .mockResolvedValueOnce({ id: 2, code: 'P002' } as never); // code conflict

    await expect(updateProduct(1, { code: 'P002' })).rejects.toThrow(ProductError);
    await expect(updateProduct(1, { code: 'P002' })).rejects.toThrow('Товар з таким кодом вже існує');
  });

  it('should regenerate slug when name changes', async () => {
    const existing = {
      id: 1,
      code: 'p001',
      name: 'Old Name',
      priceRetail: 100,
      priceWholesale: 80,
    };
    mockPrisma.product.findUnique.mockResolvedValue(existing as never);
    mockPrisma.product.findFirst.mockResolvedValue(null); // no slug conflict
    mockPrisma.product.update.mockResolvedValue({ id: 1 } as never);

    await updateProduct(1, { name: 'New Name' });

    expect(mockPrisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'New Name',
          slug: 'new-name',
        }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// deleteProduct
// ---------------------------------------------------------------------------
describe('deleteProduct', () => {
  it('should soft-delete (deactivate) the product', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 1 } as never);
    mockPrisma.product.update.mockResolvedValue({} as never);

    await deleteProduct(1);

    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isActive: false },
    });
  });

  it('should throw 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);

    await expect(deleteProduct(999)).rejects.toThrow(ProductError);
    await expect(deleteProduct(999)).rejects.toThrow('Товар не знайдено');
  });
});

// ---------------------------------------------------------------------------
// getPromoProducts
// ---------------------------------------------------------------------------
describe('getPromoProducts', () => {
  it('should return promo products with default limit', async () => {
    const promoItems = [
      { id: 1, name: 'Promo 1', isPromo: true },
      { id: 2, name: 'Promo 2', isPromo: true },
    ];
    mockPrisma.product.findMany.mockResolvedValue(promoItems as never);

    const result = await getPromoProducts();

    expect(result).toEqual(promoItems);
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, isPromo: true, quantity: { gt: 0 } },
        orderBy: { ordersCount: 'desc' },
        take: 10,
      })
    );
  });

  it('should respect custom limit', async () => {
    mockPrisma.product.findMany.mockResolvedValue([] as never);

    await getPromoProducts(5);

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 })
    );
  });
});

// ---------------------------------------------------------------------------
// getNewProducts
// ---------------------------------------------------------------------------
describe('getNewProducts', () => {
  it('should return newest products ordered by createdAt desc', async () => {
    const newItems = [{ id: 3, name: 'Newest' }];
    mockPrisma.product.findMany.mockResolvedValue(newItems as never);

    const result = await getNewProducts();

    expect(result).toEqual(newItems);
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    );
  });

  it('should respect custom limit', async () => {
    mockPrisma.product.findMany.mockResolvedValue([] as never);

    await getNewProducts(3);

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    );
  });
});

// ---------------------------------------------------------------------------
// getPopularProducts
// ---------------------------------------------------------------------------
describe('getPopularProducts', () => {
  it('should return popular products ordered by ordersCount desc', async () => {
    const popularItems = [
      { id: 5, name: 'Bestseller', ordersCount: 100 },
      { id: 6, name: 'Popular', ordersCount: 80 },
    ];
    mockPrisma.product.findMany.mockResolvedValue(popularItems as never);

    const result = await getPopularProducts();

    expect(result).toEqual(popularItems);
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, quantity: { gt: 0 } },
        orderBy: { ordersCount: 'desc' },
        take: 10,
      })
    );
  });

  it('should respect custom limit', async () => {
    mockPrisma.product.findMany.mockResolvedValue([] as never);

    await getPopularProducts(20);

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 })
    );
  });
});
