import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parseSearchParams,
} from './api-response';

describe('successResponse', () => {
  it('should return success: true with data', async () => {
    const res = successResponse({ id: 1, name: 'Test' });
    const body = await res.json();
    expect(body).toEqual({ success: true, data: { id: 1, name: 'Test' } });
    expect(res.status).toBe(200);
  });

  it('should use custom status code', async () => {
    const res = successResponse('created', 201);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: 'created' });
    expect(res.status).toBe(201);
  });

  it('should handle null data', async () => {
    const res = successResponse(null);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: null });
  });

  it('should handle array data', async () => {
    const res = successResponse([1, 2, 3]);
    const body = await res.json();
    expect(body).toEqual({ success: true, data: [1, 2, 3] });
  });
});

describe('errorResponse', () => {
  it('should return success: false with error message', async () => {
    const res = errorResponse('Not found');
    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'Not found' });
    expect(res.status).toBe(400);
  });

  it('should use custom status code', async () => {
    const res = errorResponse('Unauthorized', 401);
    const body = await res.json();
    expect(body).toEqual({ success: false, error: 'Unauthorized' });
    expect(res.status).toBe(401);
  });

  it('should handle 500 error', async () => {
    const res = errorResponse('Internal server error', 500);
    expect(res.status).toBe(500);
  });
});

describe('paginatedResponse', () => {
  it('should return paginated data with correct pagination info', async () => {
    const res = paginatedResponse([{ id: 1 }, { id: 2 }], 50, 1, 20);
    const body = await res.json();
    expect(body).toEqual({
      success: true,
      data: [{ id: 1 }, { id: 2 }],
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
      },
    });
  });

  it('should calculate totalPages correctly', async () => {
    const res = paginatedResponse([], 100, 1, 10);
    const body = await res.json();
    expect(body.pagination.totalPages).toBe(10);
  });

  it('should handle single page', async () => {
    const res = paginatedResponse([{ id: 1 }], 1, 1, 20);
    const body = await res.json();
    expect(body.pagination.totalPages).toBe(1);
  });
});

describe('parseSearchParams', () => {
  it('should return defaults for empty params', () => {
    const params = new URLSearchParams();
    const result = parseSearchParams(params);
    expect(result).toEqual({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      search: undefined,
    });
  });

  it('should parse page and limit', () => {
    const params = new URLSearchParams('page=3&limit=50');
    const result = parseSearchParams(params);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('should clamp page minimum to 1', () => {
    const params = new URLSearchParams('page=-5');
    const result = parseSearchParams(params);
    expect(result.page).toBe(1);
  });

  it('should clamp limit to max 100', () => {
    const params = new URLSearchParams('limit=500');
    const result = parseSearchParams(params);
    expect(result.limit).toBe(100);
  });

  it('should use default limit when limit is 0 (falsy)', () => {
    const params = new URLSearchParams('limit=0');
    const result = parseSearchParams(params);
    // 0 is falsy, so || 20 gives 20, then Math.min(100, Math.max(1, 20)) = 20
    expect(result.limit).toBe(20);
  });

  it('should parse sortBy and sortOrder', () => {
    const params = new URLSearchParams('sortBy=name&sortOrder=asc');
    const result = parseSearchParams(params);
    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe('asc');
  });

  it('should default sortOrder to desc for invalid values', () => {
    const params = new URLSearchParams('sortOrder=invalid');
    const result = parseSearchParams(params);
    expect(result.sortOrder).toBe('desc');
  });

  it('should parse search parameter', () => {
    const params = new URLSearchParams('search=fairy');
    const result = parseSearchParams(params);
    expect(result.search).toBe('fairy');
  });
});
