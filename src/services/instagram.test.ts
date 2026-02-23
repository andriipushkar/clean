import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/config/env', () => ({
  env: {
    INSTAGRAM_BUSINESS_ACCOUNT_ID: 'test-account-id',
    INSTAGRAM_ACCESS_TOKEN: 'test-access-token',
  },
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

import {
  publishImagePost,
  publishCarouselPost,
  getMediaInsights,
  getAccountInsights,
  InstagramError,
} from './instagram';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

function createFetchResponse(body: object, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    headers: {
      get: (key: string) => headers[key.toLowerCase()] || null,
    },
  };
}

describe('InstagramError', () => {
  it('should create an InstagramError with default status code', () => {
    const error = new InstagramError('test error');
    expect(error.message).toBe('test error');
    expect(error.name).toBe('InstagramError');
    expect(error.statusCode).toBe(400);
  });

  it('should create an InstagramError with custom status code', () => {
    const error = new InstagramError('rate limited', 429);
    expect(error.statusCode).toBe(429);
  });

  it('should be an instance of Error', () => {
    const error = new InstagramError('test');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('publishImagePost', () => {
  it('should publish an image post through the 3-step flow', async () => {
    // Step 1: Create media container
    fetchMock
      .mockResolvedValueOnce(createFetchResponse({ id: 'container-123' }))
      // Step 2: Publish
      .mockResolvedValueOnce(createFetchResponse({ id: 'media-456' }))
      // Step 3: Get permalink
      .mockResolvedValueOnce(createFetchResponse({ permalink: 'https://instagram.com/p/abc123' }));

    const result = await publishImagePost('https://example.com/image.jpg', 'Test caption');

    expect(result).toEqual({
      igMediaId: 'media-456',
      igPermalink: 'https://instagram.com/p/abc123',
    });

    // Verify container creation call
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const containerCall = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(containerCall.image_url).toBe('https://example.com/image.jpg');
    expect(containerCall.caption).toBe('Test caption');
    expect(containerCall.access_token).toBe('test-access-token');
  });

  it('should throw InstagramError when credentials are missing', async () => {
    const { env } = await import('@/config/env');
    const originalAccountId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const originalToken = env.INSTAGRAM_ACCESS_TOKEN;

    Object.assign(env, {
      INSTAGRAM_BUSINESS_ACCOUNT_ID: '',
      INSTAGRAM_ACCESS_TOKEN: '',
    });

    await expect(publishImagePost('https://example.com/image.jpg', 'caption'))
      .rejects.toThrow('Instagram credentials not configured');

    Object.assign(env, {
      INSTAGRAM_BUSINESS_ACCOUNT_ID: originalAccountId,
      INSTAGRAM_ACCESS_TOKEN: originalToken,
    });
  });

  it('should throw InstagramError when container creation fails', async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse({ error: { message: 'Invalid image URL' } })
    );

    await expect(publishImagePost('https://bad-url.com/no-image', 'caption'))
      .rejects.toThrow('Failed to create media container: Invalid image URL');
  });

  it('should throw InstagramError when publishing fails', async () => {
    fetchMock
      .mockResolvedValueOnce(createFetchResponse({ id: 'container-123' }))
      .mockResolvedValueOnce(createFetchResponse({ error: { message: 'Publishing failed' } }));

    await expect(publishImagePost('https://example.com/image.jpg', 'caption'))
      .rejects.toThrow('Failed to publish media: Publishing failed');
  });
});

describe('publishCarouselPost', () => {
  it('should publish a carousel post with multiple images', async () => {
    const imageUrls = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'];

    // Item containers (2 images)
    fetchMock
      .mockResolvedValueOnce(createFetchResponse({ id: 'item-1' }))
      .mockResolvedValueOnce(createFetchResponse({ id: 'item-2' }))
      // Carousel container
      .mockResolvedValueOnce(createFetchResponse({ id: 'carousel-container' }))
      // Publish
      .mockResolvedValueOnce(createFetchResponse({ id: 'media-789' }))
      // Get permalink
      .mockResolvedValueOnce(createFetchResponse({ permalink: 'https://instagram.com/p/carousel123' }));

    const result = await publishCarouselPost(imageUrls, 'Carousel caption');

    expect(result).toEqual({
      igMediaId: 'media-789',
      igPermalink: 'https://instagram.com/p/carousel123',
    });

    // Verify carousel items marked as carousel items
    const item1Body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(item1Body.is_carousel_item).toBe(true);

    // Verify carousel container includes children
    const containerBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(containerBody.media_type).toBe('CAROUSEL');
    expect(containerBody.children).toEqual(['item-1', 'item-2']);
    expect(containerBody.caption).toBe('Carousel caption');
  });

  it('should throw InstagramError when fewer than 2 images provided', async () => {
    await expect(publishCarouselPost(['https://example.com/img1.jpg'], 'caption'))
      .rejects.toThrow('Carousel requires 2-10 images');
  });

  it('should throw InstagramError when more than 10 images provided', async () => {
    const urls = Array.from({ length: 11 }, (_, i) => `https://example.com/img${i}.jpg`);

    await expect(publishCarouselPost(urls, 'caption'))
      .rejects.toThrow('Carousel requires 2-10 images');
  });

  it('should throw InstagramError when item container creation fails', async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse({ error: { message: 'Bad image' } })
    );

    await expect(
      publishCarouselPost(['https://example.com/img1.jpg', 'https://example.com/img2.jpg'], 'caption')
    ).rejects.toThrow('Failed to create carousel item');
  });
});

describe('getMediaInsights', () => {
  it('should return media insights', async () => {
    const insightsData = [
      { name: 'impressions', values: [{ value: 100 }] },
      { name: 'reach', values: [{ value: 80 }] },
    ];
    fetchMock.mockResolvedValue(createFetchResponse({ data: insightsData }));

    const result = await getMediaInsights('media-123');

    expect(result).toEqual(insightsData);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('media-123/insights'),
    );
  });

  it('should throw InstagramError when API returns an error', async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse({ error: { message: 'Media not found' } })
    );

    await expect(getMediaInsights('invalid-media')).rejects.toThrow(
      'Failed to get insights: Media not found'
    );
  });

  it('should throw InstagramError when access token is missing', async () => {
    const { env } = await import('@/config/env');
    const originalToken = env.INSTAGRAM_ACCESS_TOKEN;
    Object.assign(env, { INSTAGRAM_ACCESS_TOKEN: '' });

    await expect(getMediaInsights('media-123')).rejects.toThrow(
      'Instagram access token not configured'
    );

    Object.assign(env, { INSTAGRAM_ACCESS_TOKEN: originalToken });
  });
});

describe('getAccountInsights', () => {
  it('should return account insights with follower count', async () => {
    const insightsData = [
      { name: 'impressions', values: [{ value: 5000 }] },
      { name: 'reach', values: [{ value: 3000 }] },
      { name: 'profile_views', values: [{ value: 200 }] },
    ];

    // Insights call
    fetchMock
      .mockResolvedValueOnce(createFetchResponse({ data: insightsData }))
      // Profile call for follower count
      .mockResolvedValueOnce(createFetchResponse({ followers_count: 1500 }));

    const result = await getAccountInsights();

    expect(result).toEqual({
      impressions: 5000,
      reach: 3000,
      profileViews: 200,
      followerCount: 1500,
    });
  });

  it('should return 0 for missing metrics', async () => {
    fetchMock
      .mockResolvedValueOnce(createFetchResponse({ data: [] }))
      .mockResolvedValueOnce(createFetchResponse({}));

    const result = await getAccountInsights();

    expect(result).toEqual({
      impressions: 0,
      reach: 0,
      profileViews: 0,
      followerCount: 0,
    });
  });

  it('should throw InstagramError when API returns an error', async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse({ error: { message: 'Invalid token' } })
    );

    await expect(getAccountInsights()).rejects.toThrow('Failed to get account insights: Invalid token');
  });

  it('should throw InstagramError when credentials are missing', async () => {
    const { env } = await import('@/config/env');
    const originalAccountId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    const originalToken = env.INSTAGRAM_ACCESS_TOKEN;

    Object.assign(env, {
      INSTAGRAM_BUSINESS_ACCOUNT_ID: '',
      INSTAGRAM_ACCESS_TOKEN: '',
    });

    await expect(getAccountInsights()).rejects.toThrow('Instagram credentials not configured');

    Object.assign(env, {
      INSTAGRAM_BUSINESS_ACCOUNT_ID: originalAccountId,
      INSTAGRAM_ACCESS_TOKEN: originalToken,
    });
  });
});

describe('fetchWithRetry behavior', () => {
  it('should retry on network failure and succeed', async () => {
    // First call fails, second succeeds for container creation
    fetchMock
      .mockRejectedValueOnce(new Error('Network error'))
      // Retry succeeds
      .mockResolvedValueOnce(createFetchResponse({ id: 'container-123' }))
      // Publish succeeds
      .mockResolvedValueOnce(createFetchResponse({ id: 'media-456' }))
      // Permalink
      .mockResolvedValueOnce(createFetchResponse({ permalink: 'https://instagram.com/p/abc' }));

    // fetchWithRetry uses real delays but they're small enough to wait
    const result = await publishImagePost('https://example.com/image.jpg', 'caption');
    expect(result.igMediaId).toBe('media-456');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('should handle 429 rate limit and retry after delay', async () => {
    fetchMock
      .mockResolvedValueOnce(createFetchResponse({}, 429, { 'retry-after': '0.001' }))
      // After retry
      .mockResolvedValueOnce(createFetchResponse({ id: 'container-123' }))
      .mockResolvedValueOnce(createFetchResponse({ id: 'media-456' }))
      .mockResolvedValueOnce(createFetchResponse({ permalink: 'https://instagram.com/p/abc' }));

    const result = await publishImagePost('https://example.com/image.jpg', 'caption');
    expect(result.igMediaId).toBe('media-456');
  });

  it('should throw InstagramError after max retries on 429', async () => {
    // All 3 attempts return 429 with small retry-after to avoid long waits
    fetchMock
      .mockResolvedValueOnce(createFetchResponse({}, 429, { 'retry-after': '0.001' }))
      .mockResolvedValueOnce(createFetchResponse({}, 429, { 'retry-after': '0.001' }))
      .mockResolvedValueOnce(createFetchResponse({}, 429, { 'retry-after': '0.001' }));

    try {
      await publishImagePost('https://example.com/image.jpg', 'caption');
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(InstagramError);
      expect((error as InstagramError).message).toContain('rate limit exceeded');
    }
  });
});
