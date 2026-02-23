import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  wishlistItem: {
    count: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/middleware/auth', () => ({
  withAuth: (handler: Function) => handler,
}));

vi.mock('@/utils/api-response', () => ({
  successResponse: (data: unknown) => ({
    json: () => data,
    status: 200,
    data,
  }),
  errorResponse: (message: string, status: number) => ({
    json: () => ({ error: message }),
    status,
    message,
  }),
}));

import { GET } from './route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/v1/me/wishlists/count', () => {
  const mockRequest = {} as never;
  const mockContext = { user: { id: 1 } } as never;

  it('should return wishlist item count for authenticated user', async () => {
    mockPrisma.wishlistItem.count.mockResolvedValue(5);

    const response = await (GET as Function)(mockRequest, mockContext);

    expect(mockPrisma.wishlistItem.count).toHaveBeenCalledWith({
      where: {
        wishlist: { userId: 1 },
      },
    });
    expect(response.data).toEqual({ count: 5 });
  });

  it('should return 0 when user has no wishlist items', async () => {
    mockPrisma.wishlistItem.count.mockResolvedValue(0);

    const response = await (GET as Function)(mockRequest, mockContext);

    expect(response.data).toEqual({ count: 0 });
  });

  it('should return error on database failure', async () => {
    mockPrisma.wishlistItem.count.mockRejectedValue(new Error('DB error'));

    const response = await (GET as Function)(mockRequest, mockContext);

    expect(response.status).toBe(500);
  });
});
