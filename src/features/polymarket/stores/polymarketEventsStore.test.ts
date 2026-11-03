import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';

import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

import { fetchPolymarketEventsByIds } from './polymarketEventsStore';

vi.mock('@/framework/data/http/rainbowFetch', () => ({
  rainbowFetch: vi.fn(),
}));

vi.mock('@/features/polymarket/constants', () => ({
  CATEGORIES: {
    sports: { tagId: 'sports' },
  },
  DEFAULT_CATEGORY_KEY: 'trending',
  POLYMARKET_GAMMA_API_URL: 'https://gamma-api.polymarket.com',
}));

vi.mock('@/features/polymarket/utils/transforms', () => ({
  processRawPolymarketEvent: vi.fn(),
}));

const mockRainbowFetch = rainbowFetch as MockedFunction<typeof rainbowFetch>;

describe('fetchPolymarketEventsByIds', () => {
  beforeEach(() => {
    mockRainbowFetch.mockClear();
    mockRainbowFetch.mockResolvedValue({
      data: [],
      headers: new Headers(),
      status: 200,
    });
  });

  it('requests enough events for every requested id', async () => {
    const eventIds = Array.from({ length: 61 }, (_, index) => `event-${index + 1}`);

    await fetchPolymarketEventsByIds(eventIds, null);

    expect(mockRainbowFetch).toHaveBeenCalledTimes(1);

    const [requestUrl] = mockRainbowFetch.mock.calls[0];
    const url = new URL(String(requestUrl));

    expect(url.searchParams.get('limit')).toBe('61');
    expect(url.searchParams.getAll('id')).toEqual(eventIds);
  });

  it('skips the fetch when there are no ids', async () => {
    await expect(fetchPolymarketEventsByIds([], null)).resolves.toEqual([]);

    expect(mockRainbowFetch).not.toHaveBeenCalled();
  });
});
