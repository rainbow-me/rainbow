import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { TOKEN_SEARCH_V2 } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { type TokenSearchItem } from '@/features/token-search/core/tokenSearch';
import { fetchTokenSearch } from '@/features/token-search/data/tokenSearch';

import { useSwapsSearchStore, useSwapTokenSearchStore, useTokenSearchStore, useUnverifiedTokenSearchStore } from './searchV2';

vi.mock('@/features/token-search/data/tokenSearch', async importOriginal => ({
  ...(await importOriginal<typeof import('@/features/token-search/data/tokenSearch')>()),
  fetchTokenSearch: vi.fn(),
}));
vi.mock('@/features/config/stores/remoteConfig', () => import('@/features/config/stores/__mocks__/remoteConfig'));
vi.mock('@/state/swaps/swapsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useSwapsStore: createBaseStore(() => ({ selectedOutputChainId: 1 })) };
});
vi.mock('@/handlers/web3', () => ({ getProvider: vi.fn() }));

const searchTokens = vi.mocked(fetchTokenSearch);

const ZERO = '0x0000000000000000000000000000000000000000';
const USDC_MAINNET = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const BRETT_BASE = '0x532f27101965dd16442e59d40670faf5ebb142e4';

function item(symbol: string, instances: [assetId: string, decimals: number][], verified = true): TokenSearchItem {
  return {
    id: symbol,
    token: {
      symbol,
      name: symbol,
      iconUrl: 'https://example.com/icon.png',
      verification: verified ? 'VERIFICATION_STATUS_VERIFIED' : 'VERIFICATION_STATUS_UNVERIFIED',
      instances: instances.map(([assetId, decimals]) => ({ assetId, decimals })),
    },
  };
}

const USDC = item('USDC', [
  [`eip155:1/erc20:${USDC_MAINNET}`, 6],
  [`eip155:8453/erc20:${USDC_BASE}`, 6],
]);
const ETH = item('ETH', [
  ['eip155:1/native:eth', 18],
  [`eip155:8453/native:${ZERO}`, 18],
]);
const BRETT = item('BRETT', [[`eip155:8453/erc20:${BRETT_BASE}`, 18]]);

function search(query: string, chainId: ChainId) {
  return useSwapTokenSearchStore.getState().fetch({ query, chainId }, { force: true, updateQueryKey: true });
}

describe('useSwapTokenSearchStore', () => {
  beforeAll(() => {
    useExperimentalConfigStore.getState().setFlag(TOKEN_SEARCH_V2, true);
  });

  afterEach(() => {
    searchTokens.mockReset();
  });

  it.each([
    {
      name: 'USDC on Base, listed mainnet first',
      result: USDC,
      query: 'usdc',
      chainId: ChainId.base,
      expected: { address: USDC_BASE, chainId: ChainId.base, decimals: 6, isNativeAsset: false, uniqueId: `${USDC_BASE}_${ChainId.base}` },
    },
    {
      name: 'ETH on Base',
      result: ETH,
      query: 'eth',
      chainId: ChainId.base,
      expected: { address: ZERO, chainId: ChainId.base, decimals: 18, isNativeAsset: true, uniqueId: `${ZERO}_${ChainId.base}` },
    },
    {
      name: 'ETH on mainnet',
      result: ETH,
      query: 'eth',
      chainId: ChainId.mainnet,
      expected: { address: 'eth', chainId: ChainId.mainnet, decimals: 18, isNativeAsset: true, uniqueId: `eth_${ChainId.mainnet}` },
    },
  ])('opens $name on the output chain', async ({ result, query, chainId, expected }) => {
    searchTokens.mockResolvedValue({ sections: [{ type: 'SECTION_TYPE_TOP', items: [result] }] });

    const results = await search(query, chainId);

    expect(searchTokens).toHaveBeenCalledTimes(1);
    expect(searchTokens.mock.calls[0][0]).toEqual({ query, category: 'CATEGORY_TOKENS', chainIds: [chainId], limit: 50 });
    expect(results?.verified).toHaveLength(1);
    expect(results?.verified[0]).toMatchObject(expected);
    expect(results?.verified[0].networks[chainId]).toEqual({ address: expected.address, decimals: expected.decimals });
  });

  it('looks on every chain when nothing verified is on the output chain, and opens the match where it is deployed', async () => {
    searchTokens.mockResolvedValueOnce({}).mockResolvedValueOnce({ sections: [{ type: 'SECTION_TYPE_TOP', items: [BRETT] }] });

    const results = await search('brett', ChainId.optimism);

    expect(searchTokens.mock.calls[1][0]).toEqual({ query: 'brett', category: 'CATEGORY_TOKENS', limit: 50 });
    expect(results?.verified).toEqual([]);
    expect(results?.crosschain[0]).toMatchObject({ address: BRETT_BASE, chainId: ChainId.base, decimals: 18 });
  });

  it('finds a pasted address deployed only on another chain', async () => {
    searchTokens.mockResolvedValueOnce({}).mockResolvedValueOnce({ sections: [{ type: 'SECTION_TYPE_TOP', items: [BRETT] }] });

    const results = await search(BRETT_BASE, ChainId.mainnet);

    expect(results?.crosschain.map(asset => asset.address)).toEqual([BRETT_BASE]);
  });

  it('does not search for an empty query', async () => {
    const results = await search('', ChainId.base);

    expect(searchTokens).not.toHaveBeenCalled();
    expect(results).toBeNull();
  });

  it('lets a failed request reach the store and keeps the previous query results', async () => {
    searchTokens.mockResolvedValueOnce({ sections: [{ type: 'SECTION_TYPE_TOP', items: [USDC] }] });
    await search('usdc', ChainId.base);

    searchTokens.mockRejectedValueOnce(new Error('boom'));
    await search('usdce', ChainId.base);

    expect(useSwapTokenSearchStore.getState().status).toBe('error');
    expect(
      useSwapTokenSearchStore
        .getState()
        .getResults()
        ?.verified.map(asset => asset.address)
    ).toEqual([USDC_BASE]);
  });

  it('shows no results from before the query was cleared when the next query fails', async () => {
    const unsubscribe = useSwapTokenSearchStore.subscribe(() => undefined);
    searchTokens.mockResolvedValueOnce({ sections: [{ type: 'SECTION_TYPE_TOP', items: [USDC] }] });
    useSwapsSearchStore.setState({ searchQuery: 'usdc' });
    await vi.waitFor(() => expect(useSwapTokenSearchStore.getState().getData()?.verified).toHaveLength(1));

    // The empty query was answered before, so it may be served from the cache
    useSwapsSearchStore.setState({ searchQuery: '' });
    await vi.waitFor(() => expect(useSwapTokenSearchStore.getState().getData()).toBeNull());
    searchTokens.mockRejectedValueOnce(new Error('boom'));
    useSwapsSearchStore.setState({ searchQuery: 'pepe' });
    await vi.waitFor(() => expect(useSwapTokenSearchStore.getState().getStatus('isError')).toBe(true));

    expect(useSwapTokenSearchStore.getState().getResults()).toBeNull();
    unsubscribe();
    useSwapsSearchStore.setState({ searchQuery: '' });
  });

  it.each([
    { name: 'the flag off', flag: false, searchQuery: 'usdc', legacy: true },
    { name: 'the flag on and no query', flag: true, searchQuery: ' ', legacy: true },
    { name: 'the flag on and a query', flag: true, searchQuery: 'usdc', legacy: false },
  ])('with $name, fetches through the legacy stores: $legacy', ({ flag, searchQuery, legacy }) => {
    useExperimentalConfigStore.getState().setFlag(TOKEN_SEARCH_V2, flag);
    useSwapsSearchStore.setState({ searchQuery });

    expect(useTokenSearchStore.getState().enabled).toBe(legacy);
    expect(useUnverifiedTokenSearchStore.getState().enabled).toBe(legacy);
    expect(useSwapTokenSearchStore.getState().enabled).toBe(flag);

    useExperimentalConfigStore.getState().setFlag(TOKEN_SEARCH_V2, true);
    useSwapsSearchStore.setState({ searchQuery: '' });
  });
});
