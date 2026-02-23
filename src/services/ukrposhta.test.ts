import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env before import
vi.mock('@/config/env', () => ({
  env: { UKRPOSHTA_BEARER_TOKEN: 'test-token' },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ukrposhta service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track parcel successfully', async () => {
    const { trackParcel } = await import('./ukrposhta');

    const mockResponse = {
      barcode: '0503300045006',
      step: 8,
      date: '2024-01-15T14:30:00',
      name: 'Доставлено',
      event: '41',
      eventName: 'Вручення',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });

    const result = await trackParcel('0503300045006');
    expect(result.barcode).toBe('0503300045006');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('barcode=0503300045006'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('should throw on 404', async () => {
    const { trackParcel, UkrposhtaError } = await import('./ukrposhta');

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(trackParcel('invalid')).rejects.toThrow(UkrposhtaError);
  });
});
