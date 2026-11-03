import { describe, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';

import { fetchTokenSearch } from './tokenSearch';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/resources/platform/client', () => ({ getPlatformClient: () => ({ get }) }));
vi.mock('@/features/config/stores/remoteConfig', () => import('@/features/config/stores/__mocks__/remoteConfig'));

describe('fetchTokenSearch', () => {
  it('sends chains as CAIP-2 ids and returns the search result', async () => {
    const result = { sections: [] };
    get.mockResolvedValue({ data: { result } });

    await expect(
      fetchTokenSearch(
        {
          query: 'usdc',
          category: 'CATEGORY_TOKENS',
          chainIds: [ChainId.mainnet, ChainId.base],
          preferredChainId: ChainId.base,
          limit: 20,
        },
        null
      )
    ).resolves.toBe(result);

    expect(get).toHaveBeenCalledWith('/search/Search', {
      abortController: null,
      params: {
        query: 'usdc',
        category: 'CATEGORY_TOKENS',
        chainIds: 'eip155:1,eip155:8453',
        preferredChainId: 'eip155:8453',
        limit: '20',
      },
    });
  });
});
