import { beforeEach, expect, it, vi } from 'vitest';

import { SWAP_ASSETS } from '@/features/solana/core/swap';

import { SolanaSwapTokenRow } from './SolanaSwapTokenRow';

const mocks = vi.hoisted(() => ({ copy: vi.fn(), open: vi.fn(), haptics: vi.fn() }));
vi.mock('react-native-turbo-haptics', () => ({ triggerHaptics: mocks.haptics }));
vi.mock('@/__swaps__/screens/Swap/components/CoinRow', () => ({ CoinRowView: 'CoinRowView' }));
vi.mock('@/__swaps__/screens/Swap/components/CoinRowButton', () => ({ CoinRowButton: 'CoinRowButton' }));
vi.mock('@/components/native-context-menu/contextMenu', () => ({ default: 'ContextMenu' }));
vi.mock('@/features/solana/ui/SolanaSwapControls', () => ({ SolanaSwapIcon: 'Icon' }));
vi.mock('@/hooks/useClipboard', () => ({ setClipboard: mocks.copy }));
vi.mock('@/utils/openInBrowser', () => ({ openInBrowser: mocks.open }));
vi.mock('@/languages', () => ({
  t: (key: string) => key,
  l: { exchange: { coin_row: { copy_contract_address: 'Copy contract address', view_on: 'View on' } } },
}));

beforeEach(() => vi.clearAllMocks());

it('uses the shared output row and preserves mint case for copy and explorer actions', () => {
  const onPress = vi.fn();
  const row = SolanaSwapTokenRow({ assetId: 'bonk', output: true, onPress });
  expect(row.type).toBe('CoinRowView');
  expect(row.props).toMatchObject({ name: 'Bonk', subtitle: 'BONK', output: true, onPress });
  const [info, star] = row.props.actions.props.children;
  const select = (actionKey: string) => info.props.onPressMenuItem({ nativeEvent: { actionKey } });
  select('copyAddress');
  expect(mocks.copy).toHaveBeenCalledWith(SWAP_ASSETS.bonk.asset.address);
  select('blockExplorer');
  expect(mocks.open).toHaveBeenCalledWith(`https://solscan.io/token/${SWAP_ASSETS.bonk.asset.address}`);
  expect(star.props.disabled).toBe(true);
});

it('does not offer a fabricated token mint for native SOL', () => {
  const row = SolanaSwapTokenRow({ assetId: 'sol', output: true, onPress: vi.fn() });
  const [info] = row.props.actions.props.children;
  expect(info.props.disabled).toBe(true);
  expect(info.props.onPress).toBeUndefined();
});

it('uses the input row without output actions', () => {
  const row = SolanaSwapTokenRow({ assetId: 'usdc', balance: '12', output: false, onPress: vi.fn() });
  expect(row.props.subtitle).toBe('12 USDC');
  expect(row.props.actions).toBeUndefined();
});
