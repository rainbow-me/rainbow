import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

import { fetchPolymarketEventsByIds } from './polymarketEventsStore';

jest.mock('@/framework/data/http/rainbowFetch', () => ({
  rainbowFetch: jest.fn(),
}));

jest.mock('@/features/polymarket/constants', () => ({
  CATEGORIES: {
    sports: { tagId: 'sports' },
  },
  DEFAULT_CATEGORY_KEY: 'trending',
  POLYMARKET_GAMMA_API_URL: 'https://gamma-api.polymarket.com',
}));

jest.mock('@/features/polymarket/utils/transforms', () => ({
  processRawPolymarketEvent: jest.fn(),
}));

const mockRainbowFetch = rainbowFetch as jest.MockedFunction<typeof rainbowFetch>;

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
