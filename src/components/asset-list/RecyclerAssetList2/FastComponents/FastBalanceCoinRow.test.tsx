import { beforeEach, expect, it, vi } from 'vitest';

import { type SolanaBalance } from '@/features/solana/core/balances';
import { SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';

import { type ExtendedState } from '../core/RawRecyclerList';
import FastBalanceCoinRow from './FastBalanceCoinRow';

const state = vi.hoisted(() => ({ balances: [] as SolanaBalance[], evmReads: vi.fn(), navigate: vi.fn(), toggle: vi.fn() }));
vi.mock('react', () => {
  const hooks = {
    memo: (component: unknown) => component,
    useCallback: (fn: unknown) => fn,
    useMemo: (fn: () => unknown) => fn(),
    useRef: (current: unknown) => ({ current }),
  };
  return { default: hooks, ...hooks };
});
vi.mock('react-native', () => ({ View: 'View', StyleSheet: { create: (styles: unknown) => styles } }));
vi.mock('@/components/animations/ButtonPressAnimation', () => ({ ButtonPressAnimation: 'Button' }));
vi.mock('@/components/coin-icon/CoinIconIndicator', () => ({ default: 'Indicator' }));
vi.mock('@/components/coin-icon/RainbowCoinIcon', () => ({ default: 'Icon' }));
vi.mock('@/components/icons', () => ({ Icon: 'Checkmark' }));
vi.mock('@/components/live-token-text/LiveTokenText', () => ({ LiveTokenText: 'LiveText' }));
vi.mock('@/design-system', () => ({ Text: 'Text' }));
vi.mock('@/design-system/utils/opacity', () => ({ opacity: (color: string) => color }));
vi.mock('@/features/network/types/backendNetworks', () => ({ ChainId: { mainnet: 1 } }));
vi.mock('@/features/token/ui/utils/formatLiquidityCappedBalance', () => ({ formatLiquidityCappedBalance: vi.fn() }));
vi.mock('@/features/solana/data/solanaBalancesStore', () => ({
  useSolanaWalletBalances: (selector: (value: unknown) => unknown) => selector({ data: { balances: state.balances } }),
  selectSolanaBalance: (_: unknown, id: string) => state.balances.find(balance => balance.assetId === id),
}));
vi.mock('@/hooks/useAccountAsset', () => ({ default: state.evmReads }));
vi.mock('@/hooks/useCoinListEditOptions', () => ({ useCoinListFinishEditingOptions: () => ({ selectedItems: [] }) }));
vi.mock('@/navigation/Navigation', () => ({ default: { handleAction: state.navigate } }));
vi.mock('@/navigation/routesNames', () => ({ default: { EXPANDED_ASSET_SHEET_V2: 'ExpandedAssetSheet' } }));
vi.mock('@/state/liveTokens/selectors', () => ({ select24hChange: vi.fn() }));
vi.mock('@/styles', () => ({
  borders: { buildCircleAsObject: () => ({}) },
  padding: { object: () => ({}) },
  colors: {},
  shadow: { buildAsObject: () => ({}) },
}));
vi.mock('@/helpers/utilities', () => ({ toSignificantDigits: ({ value }: { value: number }) => Number(value).toFixed(2) }));
vi.mock('@/features/currency/utils/nativeDisplay', () => ({
  convertAmountToNativeDisplay: (value: string, currency: string) => `${currency} ${value}`,
}));

type Element = { type: unknown; props: { children?: unknown; [key: string]: unknown } };
function elements(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== 'object' || !('props' in node)) return [];
  const element = node as Element;
  if (typeof element.type === 'function') return elements(element.type(element.props));
  return [element, ...elements(element.props.children)];
}
const id = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const balance: SolanaBalance = {
  assetId: id,
  name: 'USD Coin',
  symbol: 'USDC',
  amount: '2',
  rawUnits: false,
  value: '2',
  iconUrl: 'https://example.com/usdc.png',
  relativeChange24h: 0,
};
const extendedState = (editing = false) =>
  ({
    nativeCurrency: 'USD',
    nativeCurrencySymbol: '$',
    theme: { colors: {}, isDarkMode: false },
    hiddenAssets: new Set(),
    pinnedCoins: {},
    isCoinListEdited: editing,
    toggleSelectedCoin: state.toggle,
  }) as unknown as ExtendedState;
beforeEach(() => {
  state.balances = [balance];
  state.evmReads.mockReset();
  state.navigate.mockReset();
  state.toggle.mockReset();
});
it('renders Solana through the shared row with numeric chain ID and balance fallbacks without reading the EVM store', () => {
  const row = elements(FastBalanceCoinRow({ uniqueId: id, isSolana: true, extendedState: extendedState() }));
  expect(row.find(item => item.type === 'Icon')?.props).toMatchObject({ chainId: SOLANA_CHAIN_ID, symbol: 'USDC', icon: balance.iconUrl });
  expect(row.filter(item => item.type === 'LiveText').map(item => item.props.fallback)).toEqual(['USD 2', '0.00%']);
  expect(row.some(item => item.type === 'Text' && item.props.children === '2 USDC')).toBe(true);
  expect(state.evmReads).not.toHaveBeenCalled();
});
it('selects Solana by its case-sensitive ID through both the checkbox and row', () => {
  const row = elements(FastBalanceCoinRow({ uniqueId: id, isSolana: true, extendedState: extendedState(true) }));
  for (const button of row.filter(item => item.type === 'Button')) (button.props.onPress as () => void)();
  expect(state.toggle).toHaveBeenCalledTimes(2);
  expect(state.toggle).toHaveBeenCalledWith(id);
  expect(state.navigate).not.toHaveBeenCalled();
});
it('does not send a Solana row tap into the EVM expanded sheet', () => {
  const row = elements(FastBalanceCoinRow({ uniqueId: id, isSolana: true, extendedState: extendedState() }));
  (row.find(item => item.type === 'Button')?.props.onPress as () => void)();
  expect(state.navigate).not.toHaveBeenCalled();
});
it('preserves EVM lookup, normal navigation and edit selection', () => {
  const asset = { name: 'Ethereum', address: '0x1', chainId: 1 };
  state.evmReads.mockReturnValue(asset);
  let row = elements(FastBalanceCoinRow({ uniqueId: '0x1_1', extendedState: extendedState() }));
  (row.find(item => item.type === 'Button')?.props.onPress as () => void)();
  expect(state.evmReads).toHaveBeenCalledWith('0x1_1', 'USD');
  expect(state.navigate).toHaveBeenCalledWith('ExpandedAssetSheet', { asset, address: asset.address, chainId: 1 });
  state.navigate.mockClear();
  row = elements(FastBalanceCoinRow({ uniqueId: '0x1_1', extendedState: extendedState(true) }));
  (row.find(item => item.props.testID === 'balance-coin-row-Ethereum')?.props.onPress as () => void)();
  expect(state.toggle).toHaveBeenCalledWith('0x1_1');
  expect(state.navigate).not.toHaveBeenCalled();
});
it('refreshes the data when the recycler changes the Solana asset ID', () => {
  state.balances.push({ ...balance, assetId: 'other', name: 'Other', symbol: 'OTHER' });
  const row = elements(FastBalanceCoinRow({ uniqueId: 'other', isSolana: true, extendedState: extendedState() }));
  expect(row.find(item => item.type === 'Icon')?.props.symbol).toBe('OTHER');
});
