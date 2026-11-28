import { type createBaseStore } from '@storesjs/stores';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useSwapsSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { SOLANA_CHAIN_ID, SOLANA_MAINNET_CHAIN } from '@/features/solana/core/chainId';
import { fetchTokenSearch } from '@/features/token-search/data/tokenSearch';

import { useSolanaBalancesAddress } from './solanaBalancesStore';
import { useSolanaInputSearchQuery, useSolanaInputTokenSearch, useSolanaOutputTokenSearch } from './solanaTokenSearchStore';

vi.mock('@/__swaps__/screens/Swap/resources/search/searchV2', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useSwapsSearchStore: createBaseStore(() => ({ searchQuery: '' })) };
});
vi.mock('./solanaBalancesStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useSolanaBalancesAddress: createBaseStore<string | null>(() => 'enabled') };
});
vi.mock('@/features/token-search/data/tokenSearch', () => ({ fetchTokenSearch: vi.fn() }));
const enabledAddress = useSolanaBalancesAddress as unknown as ReturnType<typeof createBaseStore<string | null>>;
const mint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
const result = {
  sections: [
    {
      type: 'SECTION_TYPE_TOP' as const,
      items: [
        {
          id: 'jup',
          token: { name: 'Jupiter', symbol: 'JUP', instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/token:${mint}`, decimals: 6 }] },
        },
      ],
    },
  ],
};
afterEach(() => {
  vi.mocked(fetchTokenSearch).mockReset();
  enabledAddress.setState('enabled', true);
});

describe('Solana search queries', () => {
  it.each(['Jupiter', '$JUP', mint])('queries the backend by name, symbol or exact-case mint: %s', async query => {
    vi.mocked(fetchTokenSearch).mockResolvedValue(result);
    const data = await useSolanaOutputTokenSearch.getState().fetch({ query }, { force: true });
    expect(fetchTokenSearch).toHaveBeenLastCalledWith({ query, chainIds: [SOLANA_CHAIN_ID], category: 'CATEGORY_TOKENS', limit: 50 }, null);
    expect(data?.[0]).toMatchObject({ id: mint, symbol: 'JUP' });
  });
  it('does not request defaults or bypass the feature/account gate', async () => {
    await useSolanaOutputTokenSearch.getState().fetch({ query: '' }, { force: true });
    enabledAddress.setState(null, true);
    await useSolanaOutputTokenSearch.getState().fetch({ query: 'JUP' }, { force: true });
    expect(fetchTokenSearch).not.toHaveBeenCalled();
  });
  it('reacts to both search fields and keeps their query caches separate', async () => {
    vi.mocked(fetchTokenSearch).mockResolvedValue(result);
    const stops = [useSolanaInputTokenSearch.subscribe(() => undefined), useSolanaOutputTokenSearch.subscribe(() => undefined)];
    try {
      useSwapsSearchStore.setState({ searchQuery: '  Jupiter  ' });
      useSolanaInputSearchQuery.setState(mint, true);
      await vi.waitFor(() =>
        expect(useSolanaOutputTokenSearch.getState().getCacheEntry({ query: 'Jupiter' })?.data?.[0].symbol).toBe('JUP')
      );
      await vi.waitFor(() => expect(useSolanaInputTokenSearch.getState().getCacheEntry({ query: mint })?.data?.[0].symbol).toBe('JUP'));
    } finally {
      stops.forEach(stop => stop());
    }
  });
});
