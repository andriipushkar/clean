import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPublication, getPublications, publishNow, PublicationError } from './publication';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    publication: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    publicationImage: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock('@/config/env', () => ({
  env: {
    INSTAGRAM_ACCESS_TOKEN: '',
    INSTAGRAM_BUSINESS_ACCOUNT_ID: '',
  },
}));

vi.mock('@/services/instagram', () => ({
  publishImagePost: vi.fn(),
  publishReelsPost: vi.fn(),
  postFirstComment: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import type { MockPrismaClient } from '@/test/prisma-mock';

const mockPrisma = prisma as unknown as MockPrismaClient;
const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
  mockFetch.mockResolvedValue({ ok: true });
});

describe('createPublication', () => {
  it('should create a draft publication', async () => {
    const input = { title: 'Test', content: 'Content', channels: ['telegram'] };
    mockPrisma.publication.create.mockResolvedValue({ id: 1, status: 'draft', ...input } as never);

    const result = await createPublication(input, 1);

    expect(result.status).toBe('draft');
    expect(mockPrisma.publication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Test',
        content: 'Content',
        channels: ['telegram'],
        status: 'draft',
        createdBy: 1,
      }),
    });
  });

  it('should create a scheduled publication when scheduledAt is provided', async () => {
    const input = {
      title: 'Scheduled',
      content: 'Content',
      channels: ['telegram'],
      scheduledAt: '2026-03-01T12:00:00Z',
    };
    mockPrisma.publication.create.mockResolvedValue({ id: 1, status: 'scheduled' } as never);

    await createPublication(input, 1);

    expect(mockPrisma.publication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: 'scheduled' }),
    });
  });

  it('should pass optional fields', async () => {
    const input = {
      title: 'Test',
      content: 'Content',
      channels: ['telegram', 'viber'],
      hashtags: '#test',
      imagePath: '/images/test.jpg',
      productId: 5,
      buttons: [{ text: 'Buy', url: 'https://example.com' }],
    };
    mockPrisma.publication.create.mockResolvedValue({ id: 1 } as never);

    await createPublication(input, 1);

    expect(mockPrisma.publication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        hashtags: '#test',
        imagePath: '/images/test.jpg',
        productId: 5,
        buttons: [{ text: 'Buy', url: 'https://example.com' }],
      }),
    });
  });
});

describe('getPublications', () => {
  it('should return paginated publications', async () => {
    mockPrisma.publication.findMany.mockResolvedValue([{ id: 1 }] as never);
    mockPrisma.publication.count.mockResolvedValue(1);

    const result = await getPublications();
    expect(result).toEqual({ publications: [{ id: 1 }], total: 1 });
  });

  it('should filter by status', async () => {
    mockPrisma.publication.findMany.mockResolvedValue([] as never);
    mockPrisma.publication.count.mockResolvedValue(0);

    await getPublications({ status: 'draft' });

    expect(mockPrisma.publication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'draft' } })
    );
  });

  it('should paginate correctly', async () => {
    mockPrisma.publication.findMany.mockResolvedValue([] as never);
    mockPrisma.publication.count.mockResolvedValue(0);

    await getPublications({ page: 2, limit: 5 });

    expect(mockPrisma.publication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 })
    );
  });
});

describe('publishNow', () => {
  it('should throw 404 for non-existent publication', async () => {
    mockPrisma.publication.findUnique.mockResolvedValue(null);
    await expect(publishNow(999)).rejects.toThrow(PublicationError);
    await expect(publishNow(999)).rejects.toThrow('Публікацію не знайдено');
  });

  it('should publish to Telegram when configured', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-token');
    vi.stubEnv('TELEGRAM_CHANNEL_ID', '@test');

    mockPrisma.publication.findUnique.mockResolvedValue({
      id: 1,
      title: 'Test',
      content: 'Content',
      channels: ['telegram'],
      hashtags: '#test',
      buttons: null,
    } as never);
    mockPrisma.publication.update.mockResolvedValue({ id: 1, status: 'published' } as never);

    await publishNow(1);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.telegram.org'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockPrisma.publication.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ status: 'published' }),
    });
  });

  it('should publish to Viber when configured', async () => {
    vi.stubEnv('VIBER_AUTH_TOKEN', 'test-viber-token');

    mockPrisma.publication.findUnique.mockResolvedValue({
      id: 2,
      title: 'Test',
      content: 'Content',
      channels: ['viber'],
      hashtags: null,
      buttons: null,
    } as never);
    mockPrisma.publication.update.mockResolvedValue({ id: 2, status: 'published' } as never);

    await publishNow(2);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://chatapi.viber.com/pa/broadcast_message',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should update status to published', async () => {
    mockPrisma.publication.findUnique.mockResolvedValue({
      id: 1,
      title: 'Test',
      content: 'Content',
      channels: [],
      hashtags: null,
      buttons: null,
    } as never);
    mockPrisma.publication.update.mockResolvedValue({ id: 1, status: 'published' } as never);

    const result = await publishNow(1);
    expect(result.status).toBe('published');
  });
});
