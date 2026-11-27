import { expect, it, vi } from 'vitest';

import { SOLANA_MAINNET_CHAIN } from '@/features/solana/core/chainId';
import { type SolanaSwapAsset } from '@/features/solana/core/swap';
import { parseSolanaSearchResults } from '@/features/solana/core/tokenSearch';

import { SolanaSwapTokenPicker } from './SolanaSwapTokenPicker';

const mocks = vi.hoisted(() => ({ query: '', options: [] as SolanaSwapAsset[], outputQuery: vi.fn(), inputQuery: vi.fn() }));
vi.mock('react', async original => ({ ...(await original<typeof import('react')>()), useEffect: () => undefined }));
vi.mock('react-native-reanimated', () => ({
  useSharedValue: (value: unknown) => ({ value }),
  useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
  useAnimatedStyle: (fn: () => unknown) => fn(),
  useAnimatedRef: () => ({ current: null }),
  runOnJS: (fn: unknown) => fn,
}));
vi.mock('@/design-system', () => ({ Box: 'Box', useColorMode: () => ({ isDarkMode: false }), useForegroundColor: () => '#0000FF' }));
vi.mock('@/components/token-search/styles', () => ({ getTokenSearchButtonWrapperStyle: () => ({}) }));
vi.mock('@/components/token-search/SearchInput', () => ({ SearchInput: 'SearchInput' }));
vi.mock('@/__swaps__/screens/Swap/resources/search/searchV2', () => ({ useSwapsSearchStore: { setState: mocks.outputQuery } }));
vi.mock('@/features/solana/data/solanaTokenSearchStore', () => ({ useSolanaInputSearchQuery: { setState: mocks.inputQuery } }));
vi.mock('./useSolanaSwapOptions', () => ({ useSolanaSwapOptions: () => ({ query: mocks.query, options: mocks.options }) }));
vi.mock('./SolanaSwapControls', () => ({ appearance: () => ({ highContrastColor: { dark: '#222222', light: '#222222' } }) }));
vi.mock('./SolanaSwapTokenRow', () => ({ SolanaSwapTokenRow: 'TokenRow' }));
vi.mock('@/languages', () => ({
  t: (key: string) => key,
  l: { swap: { find_a_token_to_buy: 'Find a token', search_your_tokens: 'Search your tokens' } },
}));

const mint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
const [token] = parseSolanaSearchResults({
  sections: [
    {
      type: 'SECTION_TYPE_TOKENS',
      items: [{ id: mint, token: { symbol: 'JUP', instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/token:${mint}`, decimals: 6 }] } }],
    },
  ],
});

it.each([true, false])('reuses the search field and rows for output=%s, preserving raw mint text and the selected token', output => {
  mocks.query = mint;
  mocks.options = [token];
  const onSelect = vi.fn();
  const onCancel = vi.fn();
  const tree = SolanaSwapTokenPicker({ output, selected: null, balances: { [mint]: 1234567n }, onSelect, onCancel });
  const [search, rows] = tree.props.children;
  expect(search.type).toBe('SearchInput');
  expect(search.props.maxPasteLength).toBe(44);
  search.props.onSearchQueryChange(mint);
  const querySetter = output ? mocks.outputQuery : mocks.inputQuery;
  expect(querySetter).toHaveBeenLastCalledWith(...(output ? [{ searchQuery: mint }] : [mint, true]));
  const [row] = rows;
  expect(row.type).toBe('TokenRow');
  expect(row.props.balance).toBe('1.234567');
  row.props.onPress();
  expect(onSelect).toHaveBeenCalledWith(token);
  search.props.onCancelOrClosePressWorklet();
  expect(onCancel).toHaveBeenCalled();
});
