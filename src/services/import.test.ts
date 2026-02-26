import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportError, importProducts, getImportLogs, getImportLogById } from './import';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    importLog: { create: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    product: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    priceHistory: { create: vi.fn() },
  },
}));

vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: { sheet_to_json: vi.fn() },
}));

vi.mock('./image', () => ({
  processProductImage: vi.fn(),
}));

vi.mock('@/utils/slug', () => ({
  createSlug: vi.fn((text: string) => text.toLowerCase().replace(/\s+/g, '-')),
}));

import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import type { MockPrismaClient } from '@/test/prisma-mock';

const mockPrisma = prisma as unknown as MockPrismaClient;
const mockXLSX = XLSX as unknown as {
  read: ReturnType<typeof vi.fn>;
  utils: { sheet_to_json: ReturnType<typeof vi.fn> };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ImportError', () => {
  it('should create error with message and statusCode', () => {
    const error = new ImportError('Test error', 400);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('ImportError');
  });

  it('should be an instance of Error', () => {
    const error = new ImportError('Test', 500);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ImportError);
  });
});

describe('getImportLogs', () => {
  it('should return paginated import logs', async () => {
    const mockLogs = [
      { id: 1, filename: 'test.xlsx', status: 'completed_import' },
      { id: 2, filename: 'test2.xlsx', status: 'completed_import' },
    ];
    mockPrisma.importLog.findMany.mockResolvedValue(mockLogs as never);
    mockPrisma.importLog.count.mockResolvedValue(2 as never);

    const result = await getImportLogs(1, 20);

    expect(result).toEqual({ logs: mockLogs, total: 2 });
    expect(mockPrisma.importLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { id: 'desc' },
        skip: 0,
        take: 20,
      })
    );
  });

  it('should calculate correct skip for page 2', async () => {
    mockPrisma.importLog.findMany.mockResolvedValue([] as never);
    mockPrisma.importLog.count.mockResolvedValue(0 as never);

    await getImportLogs(2, 10);

    expect(mockPrisma.importLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    );
  });
});

describe('getImportLogById', () => {
  it('should return import log by id', async () => {
    const mockLog = { id: 1, filename: 'test.xlsx', status: 'completed_import', manager: { id: 1, fullName: 'Admin', email: 'admin@test.com' } };
    mockPrisma.importLog.findUnique.mockResolvedValue(mockLog as never);

    const result = await getImportLogById(1);

    expect(result).toEqual(mockLog);
    expect(mockPrisma.importLog.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        manager: { select: { id: true, fullName: true, email: true } },
      },
    });
  });

  it('should return null for non-existent id', async () => {
    mockPrisma.importLog.findUnique.mockResolvedValue(null);

    const result = await getImportLogById(999);

    expect(result).toBeNull();
  });
});

describe('importProducts', () => {
  const fileBuffer = Buffer.from('fake-excel');
  const filename = 'products.xlsx';
  const managerId = 1;

  beforeEach(() => {
    mockPrisma.importLog.create.mockResolvedValue({ id: 1 } as never);
    mockPrisma.importLog.update.mockResolvedValue({} as never);
    mockPrisma.category.findMany.mockResolvedValue([] as never);
  });

  it('should throw ImportError when Excel has no sheets', async () => {
    mockXLSX.read.mockReturnValue({ SheetNames: [], Sheets: {} } as never);

    await expect(importProducts(fileBuffer, filename, managerId)).rejects.toThrow(ImportError);
    await expect(importProducts(fileBuffer, filename, managerId)).rejects.toThrow(
      'Файл не містить даних'
    );
  });

  it('should throw ImportError when sheet has no rows', async () => {
    mockXLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } } as never);
    mockXLSX.utils.sheet_to_json.mockReturnValue([] as never);

    await expect(importProducts(fileBuffer, filename, managerId)).rejects.toThrow(ImportError);
    await expect(importProducts(fileBuffer, filename, managerId)).rejects.toThrow(
      'Файл порожній'
    );
  });

  it('should use supplier format when missing code column but has name and price', async () => {
    mockXLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } } as never);
    mockXLSX.utils.sheet_to_json.mockReturnValue([
      { 'Назва': 'Товар 1', 'Ціна роздріб': '100' },
    ] as never);

    mockPrisma.product.findUnique.mockResolvedValue(null);
    mockPrisma.product.findFirst.mockResolvedValue(null);
    mockPrisma.product.create.mockResolvedValue({ id: 1, code: 'tovar-1', name: 'Товар 1' } as never);

    const result = await importProducts(fileBuffer, filename, managerId);

    expect(result.created).toBe(1);
    expect(result.totalRows).toBe(1);
  });

  it('should create product successfully', async () => {
    mockXLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } } as never);
    mockXLSX.utils.sheet_to_json.mockReturnValue([
      { 'Код': 'P001', 'Назва': 'Мило рідке', 'Ціна роздріб': '125.50', 'Кількість': '10' },
    ] as never);

    mockPrisma.product.findUnique.mockResolvedValue(null);
    mockPrisma.product.create.mockResolvedValue({ id: 1, code: 'P001', name: 'Мило рідке' } as never);

    const result = await importProducts(fileBuffer, filename, managerId);

    expect(result.created).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.totalRows).toBe(1);
    expect(mockPrisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        code: 'P001',
        name: 'Мило рідке',
        priceRetail: 125.5,
        quantity: 10,
      }),
    });
  });

  it('should update existing product when code exists', async () => {
    mockXLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } } as never);
    mockXLSX.utils.sheet_to_json.mockReturnValue([
      { 'Код': 'P001', 'Назва': 'Мило рідке', 'Ціна роздріб': '125.50' },
    ] as never);

    const existingProduct = {
      id: 10,
      code: 'P001',
      name: 'Мило рідке',
      slug: 'milo-ridke',
      priceRetail: 125.5,
      priceWholesale: null,
    };
    mockPrisma.product.findUnique.mockResolvedValue(existingProduct as never);
    mockPrisma.product.update.mockResolvedValue({} as never);

    const result = await importProducts(fileBuffer, filename, managerId);

    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);
    expect(mockPrisma.product.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: expect.objectContaining({
        name: 'Мило рідке',
        priceRetail: 125.5,
      }),
    });
  });

  it('should track price history when retail price changes', async () => {
    mockXLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } } as never);
    mockXLSX.utils.sheet_to_json.mockReturnValue([
      { 'Код': 'P001', 'Назва': 'Мило рідке', 'Ціна роздріб': '150.00' },
    ] as never);

    const existingProduct = {
      id: 10,
      code: 'P001',
      name: 'Мило рідке',
      slug: 'milo-ridke',
      priceRetail: 125.5,
      priceWholesale: 100,
    };
    mockPrisma.product.findUnique.mockResolvedValue(existingProduct as never);
    mockPrisma.product.update.mockResolvedValue({} as never);
    mockPrisma.priceHistory.create.mockResolvedValue({} as never);

    const result = await importProducts(fileBuffer, filename, managerId);

    expect(result.updated).toBe(1);
    expect(mockPrisma.priceHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 10,
        priceRetailOld: 125.5,
        priceRetailNew: 150,
        importId: 1,
      }),
    });
  });

  it('should auto-create category when it does not exist', async () => {
    mockXLSX.read.mockReturnValue({ SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } } as never);
    mockXLSX.utils.sheet_to_json.mockReturnValue([
      { 'Код': 'P001', 'Назва': 'Мило рідке', 'Ціна роздріб': '100', 'Категорія': 'Побутова хімія' },
    ] as never);

    mockPrisma.category.findMany.mockResolvedValue([] as never);
    mockPrisma.category.findUnique.mockResolvedValue(null);
    mockPrisma.category.create.mockResolvedValue({ id: 5, name: 'Побутова хімія', slug: 'pobutova-khimiia' } as never);
    mockPrisma.product.findUnique.mockResolvedValue(null);
    mockPrisma.product.create.mockResolvedValue({ id: 1 } as never);

    const result = await importProducts(fileBuffer, filename, managerId);

    expect(result.created).toBe(1);
    expect(mockPrisma.category.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Побутова хімія',
      }),
    });
    expect(mockPrisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        categoryId: 5,
      }),
    });
  });
});
