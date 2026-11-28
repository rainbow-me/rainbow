import { beforeEach, expect, it, vi } from 'vitest';

import { SOLANA_CHAIN_ID, SOLANA_MAINNET_CHAIN } from '@/features/solana/core/chainId';
import { SWAP_ASSETS } from '@/features/solana/core/swap';
import { parseSolanaSearchResults } from '@/features/solana/core/tokenSearch';

import { SolanaSwapOptions } from './SolanaSwapOptions';

const mocks = vi.hoisted(() => ({
  address: 'enabled' as string | null,
  outputQuery: '',
  inputQuery: '',
  results: {} as Record<string, unknown>,
  balances: new Map(),
  select: vi.fn(),
}));
vi.mock('@/design-system', () => ({ Box: 'Box' }));
vi.mock('@/__swaps__/screens/Swap/providers/swap-provider', () => ({
  useSwapContext: () => ({
    internalSelectedInputAsset: { value: { chainId: 8453, isNativeAsset: true } },
    SwapInputController: { inputValues: { value: { inputAmount: '0.001' } } },
  }),
}));
vi.mock('@/__swaps__/screens/Swap/resources/search/searchV2', () => ({
  useSwapsSearchStore: (select: (state: unknown) => unknown) => select({ searchQuery: mocks.outputQuery }),
}));
vi.mock('@/features/solana/data/solanaBalancesStore', () => ({
  useSolanaBalancesAddress: () => mocks.address,
  useSolanaWalletBalances: (select: (state: unknown) => unknown) => select({ data: { balances: mocks.balances } }),
}));
vi.mock('@/features/solana/data/solanaTokenSearchStore', () => {
  const store = (select: (state: unknown) => unknown) =>
    select({ getCacheEntry: ({ query }: { query: string }) => ({ data: mocks.results[query] }) });
  return { useSolanaInputSearchQuery: () => mocks.inputQuery, useSolanaInputTokenSearch: store, useSolanaOutputTokenSearch: store };
});
vi.mock('@/features/solana/data/swapSelection', () => ({ selectSolanaSwap: mocks.select }));
vi.mock('./SolanaSwapTokenRow', () => ({ SolanaSwapTokenRow: 'TokenRow' }));

const mint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
const [jup] = parseSolanaSearchResults({
  sections: [
    {
      type: 'SECTION_TYPE_TOP',
      items: [
        {
          id: mint,
          token: { symbol: 'JUP', name: 'Jupiter', instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/token:${mint}`, decimals: 6 }] },
        },
      ],
    },
  ],
});
beforeEach(() => {
  mocks.address = 'enabled';
  mocks.outputQuery = '';
  mocks.inputQuery = '';
  mocks.results = {};
  mocks.balances.clear();
  mocks.select.mockClear();
});

it('keeps the three defaults only while the query is empty', () => {
  expect(
    SolanaSwapOptions({ output: true })?.props.children.map((row: { props: { token: { id: string } } }) => row.props.token.id)
  ).toEqual(['sol', 'usdc', 'bonk']);
  mocks.outputQuery = 'JUP';
  expect(SolanaSwapOptions({ output: true })).toBeNull();
});
it('selects a backend result with its exact mint and decimals, preserving the Base ETH input amount', () => {
  mocks.outputQuery = 'JUP';
  mocks.results.JUP = [jup];
  const tree = SolanaSwapOptions({ output: true });
  if (!tree) throw new Error('Expected output search results');
  const [row] = tree.props.children;
  row.props.onPress();
  expect(mocks.select).toHaveBeenCalledWith({ inputAsset: SWAP_ASSETS['base-eth'], outputAsset: jup, amount: '0.001' });
});
it('only offers owned, parsed balances for input searches and masks the entire list when disabled', () => {
  mocks.inputQuery = mint;
  mocks.results[mint] = [jup];
  expect(SolanaSwapOptions({ output: false })).toBeNull();
  mocks.balances.set(`${mint}_${SOLANA_CHAIN_ID}`, { rawUnits: false });
  const tree = SolanaSwapOptions({ output: false });
  if (!tree) throw new Error('Expected owned input search results');
  const [row] = tree.props.children;
  row.props.onPress();
  expect(mocks.select).toHaveBeenCalledWith({ inputAsset: jup, outputAsset: SWAP_ASSETS.sol, amount: '0' });
  mocks.address = null;
  expect(SolanaSwapOptions({ output: false })).toBeNull();
});
