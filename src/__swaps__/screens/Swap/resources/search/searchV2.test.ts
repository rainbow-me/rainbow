import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';
import { type TokenSearchResult } from '@/features/token-search/core/tokenSearch';
import { fetchTokenSearch } from '@/features/token-search/data/tokenSearch';

import { discoverSearchQueryFunction } from './searchV2';

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

const CHAIN_IDS = `${ChainId.mainnet},${ChainId.base}`;

function token(symbol: string, verification: 'VERIFICATION_STATUS_VERIFIED' | 'VERIFICATION_STATUS_UNVERIFIED', address: string) {
  return {
    id: symbol,
    token: { symbol, name: symbol, verification, instances: [{ assetId: `eip155:8453/erc20:${address}`, decimals: 18 }] },
  };
}

const MAINNET_AAA = '0x' + 'a'.repeat(40);

// An unverified result ranked between two verified ones, so splitting must keep each group's order. AAA is listed on
// Base before mainnet, the chain favorites use.
const RESULT: TokenSearchResult = {
  sections: [
    {
      type: 'SECTION_TYPE_TOP',
      items: [
        {
          id: 'AAA',
          token: {
            symbol: 'AAA',
            name: 'AAA',
            verification: 'VERIFICATION_STATUS_VERIFIED',
            instances: [
              { assetId: `eip155:8453/erc20:${'0x' + '1'.repeat(40)}`, decimals: 18 },
              { assetId: `eip155:1/erc20:${MAINNET_AAA}`, decimals: 18 },
            ],
          },
        },
      ],
    },
    {
      type: 'SECTION_TYPE_TOKENS',
      items: [
        token('BBB', 'VERIFICATION_STATUS_UNVERIFIED', '0x' + '2'.repeat(40)),
        token('CCC', 'VERIFICATION_STATUS_VERIFIED', '0x' + '3'.repeat(40)),
        token('DDD', 'VERIFICATION_STATUS_UNVERIFIED', '0x' + '4'.repeat(40)),
      ],
    },
  ],
};

describe('discoverSearchQueryFunction', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    searchTokens.mockReset();
  });

  it('searches the backend token search with the flag on and splits results by verification', async () => {
    searchTokens.mockResolvedValue(RESULT);

    const results = await discoverSearchQueryFunction({ query: 'usdc', chainIds: CHAIN_IDS, tokenSearchV2: true }, null);

    expect(searchTokens).toHaveBeenCalledWith(
      { query: 'usdc', category: 'CATEGORY_TOKENS', chainIds: [ChainId.mainnet, ChainId.base], limit: 50 },
      null
    );
    expect(results.verifiedAssets.map(asset => asset.symbol)).toEqual(['AAA', 'CCC']);
    expect(results.verifiedAssets[0]).toMatchObject({ address: MAINNET_AAA, chainId: ChainId.mainnet });
    expect(results.highLiquidityAssets.map(asset => asset.symbol)).toEqual(['BBB', 'DDD']);
    expect(results.lowLiquidityAssets).toEqual([]);
  });

  it('shows no results when the backend finds nothing for a pasted address', async () => {
    searchTokens.mockResolvedValue({ sections: [] });

    const results = await discoverSearchQueryFunction(
      { query: '0x0000000000000000000000000000000000000bad', chainIds: CHAIN_IDS, tokenSearchV2: true },
      null
    );

    expect(results).toEqual({ verifiedAssets: [], highLiquidityAssets: [], lowLiquidityAssets: [] });
  });

  it.each([
    { name: 'the default list before typing, with the flag on', query: '', tokenSearchV2: true },
    { name: 'a query with the flag off', query: 'usdc', tokenSearchV2: false },
  ])('keeps the legacy search for $name', async ({ query, tokenSearchV2 }) => {
    const legacyFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));
    vi.stubGlobal('fetch', legacyFetch);

    await discoverSearchQueryFunction({ query, chainIds: CHAIN_IDS, tokenSearchV2 }, null);

    expect(searchTokens).not.toHaveBeenCalled();
    expect(legacyFetch).toHaveBeenCalled();
  });
});
