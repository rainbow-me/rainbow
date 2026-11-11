import React, { act } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { isSwapTokenSearchV2Active, useSwapsSearchStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import { TOKEN_SEARCH_V2 } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { type TokenSearchItem } from '@/features/token-search/core/tokenSearch';
import { fetchTokenSearch } from '@/features/token-search/data/tokenSearch';
import { useSwapsStore } from '@/state/swaps/swapsStore';

import { useSwapTokenSearchV2Results } from './useSwapTokenSearchV2Results';

vi.mock('@/features/token-search/data/tokenSearch', async importOriginal => ({
  ...(await importOriginal<typeof import('@/features/token-search/data/tokenSearch')>()),
  fetchTokenSearch: vi.fn(),
}));
vi.mock('@/features/config/stores/remoteConfig', () => import('@/features/config/stores/__mocks__/remoteConfig'));
vi.mock('@/state/swaps/swapsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useSwapsStore: createBaseStore<{ selectedOutputChainId: number }>(() => ({ selectedOutputChainId: 8453 })) };
});
vi.mock('@/handlers/web3', () => ({ getProvider: vi.fn() }));

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const ROOT_TAG = 101;
const searchTokens = vi.mocked(fetchTokenSearch);

// Each query answers with one verified token on Base named after the query, unless listed as failing
let failingQueries: string[] = [];
let shown: string | null | undefined;

function token(symbol: string): TokenSearchItem {
  return {
    id: symbol,
    token: {
      symbol,
      name: symbol,
      iconUrl: 'https://example.com/icon.png',
      verification: 'VERIFICATION_STATUS_VERIFIED',
      instances: [{ assetId: `eip155:8453/erc20:0x${symbol.charCodeAt(0).toString(16).padStart(40, '0')}`, decimals: 18 }],
    },
  };
}

function Probe() {
  const isActive = isSwapTokenSearchV2Active(
    useExperimentalConfigStore(state => state.getFlag(TOKEN_SEARCH_V2)),
    useSwapsSearchStore(state => state.searchQuery)
  );
  const results = useSwapTokenSearchV2Results(isActive);
  shown = results === undefined ? undefined : (results?.verified[0]?.symbol ?? null);
  return null;
}

async function type(searchQuery: string, expected: string | null | undefined) {
  await act(async () => useSwapsSearchStore.setState({ searchQuery }));
  await vi.waitFor(() => expect(shown).toBe(expected));
}

beforeEach(() => {
  failingQueries = [];
  searchTokens.mockImplementation(async ({ query }) => {
    if (failingQueries.includes(query)) throw new Error('offline');
    return { sections: [{ type: 'SECTION_TYPE_TOP', items: [token(query.toUpperCase())] }] };
  });
  useExperimentalConfigStore.getState().setFlag(TOKEN_SEARCH_V2, true);
  useSwapsStore.setState({ selectedOutputChainId: ChainId.base });
  useSwapsSearchStore.setState({ searchQuery: '' });
  act(() => renderer.render(<Probe />, ROOT_TAG, undefined, undefined));
});

afterEach(() => {
  act(() => renderer.unmountComponentAtNode(ROOT_TAG));
});

it('keeps the last results shown when an edited query fails, including results served from the cache', async () => {
  failingQueries = ['usdcx', 'usdcz'];
  await type('usdc', 'USDC');
  await type('usdcx', 'USDC');

  await type('dai', 'DAI');
  await type('usdc', 'USDC');
  await type('usdcz', 'USDC');
});

it('shows no results when the first query after the field was cleared fails', async () => {
  failingQueries = ['pepe'];
  await type('usdc', 'USDC');
  await type('', undefined);
  await type('pepe', null);
});

it('shows no results from another output chain when a search fails after switching chains', async () => {
  await type('brett', 'BRETT');
  failingQueries = ['brett'];
  await act(async () => useSwapsStore.setState({ selectedOutputChainId: ChainId.arbitrum }));
  await vi.waitFor(() => expect(shown).toBeNull());
});
