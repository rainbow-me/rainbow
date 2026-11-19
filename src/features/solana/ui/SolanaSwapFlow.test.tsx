import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';

import { type SolanaBalances } from '@/features/solana/core/balances';
import { SWAP_ASSETS } from '@/features/solana/core/swap';

import { SolanaSwapFlow } from './SolanaSwapFlow';

type Effect = () => void | (() => void);
type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
type Element = { type: unknown; props: { children?: unknown; [key: string]: unknown } };

// Run the controller's hooks without mounting native views (same approach as the EVM lifecycle tests).
const hooks = vi.hoisted(() => ({ slots: [] as Slot[], cursor: 0, dirty: false, effects: [] as (() => void)[] }));
const restoreAssetRequire = await vi.hoisted(async () => {
  const { default: Module } = await import('node:module');
  const loader = Module as typeof Module & { _load: (request: string, ...args: unknown[]) => unknown };
  const original = loader._load;
  const spy = vi
    .spyOn(loader, '_load')
    .mockImplementation((request, ...args) => (request === '@/assets/swapSpinner.png' ? 0 : original.call(loader, request, ...args)));
  return () => spy.mockRestore();
});
afterAll(restoreAssetRequire);
const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  execute: vi.fn(),
  balances: vi.fn(),
  navigate: vi.fn(),
  feeFormat: vi.fn(() => '$0.00'),
  balancesData: undefined as SolanaBalances | undefined,
}));
vi.mock('react', () => {
  const slot = () => {
    const index = hooks.cursor;
    hooks.cursor += 1;
    return (hooks.slots[index] ??= {});
  };
  const changed = (a: readonly unknown[] | undefined, b: readonly unknown[]) => !a || b.some((value, i) => !Object.is(value, a[i]));
  return {
    default: {},
    useState: (initial: unknown) => {
      const state = slot();
      if (!('value' in state)) state.value = initial;
      return [
        state.value,
        (next: unknown) => {
          const value = typeof next === 'function' ? next(state.value) : next;
          if (!Object.is(value, state.value)) {
            state.value = value;
            hooks.dirty = true;
          }
        },
      ];
    },
    useRef: (initial: unknown) => {
      const state = slot();
      return (state.value ??= { current: initial });
    },
    useCallback: (callback: unknown, deps: readonly unknown[]) => {
      const state = slot();
      if (changed(state.deps, deps)) {
        state.value = callback;
        state.deps = deps;
      }
      return state.value;
    },
    useEffect: (effect: Effect, deps: readonly unknown[]) => {
      const state = slot();
      if (changed(state.deps, deps)) {
        state.deps = deps;
        hooks.effects.push(() => {
          state.cleanup?.();
          state.cleanup = effect() || undefined;
        });
      }
    },
  };
});
vi.mock('react-native', () => ({ ScrollView: 'ScrollView', Platform: { OS: 'ios' } }));
vi.mock('react-native-reanimated', () => ({
  useDerivedValue: (fn: () => unknown) => ({ value: fn() }),
  useAnimatedStyle: (fn: () => unknown) => fn(),
}));
vi.mock('@/__swaps__/screens/Swap/components/SwapNavbar', () => ({ SwapNavbarView: 'Navbar' }));
vi.mock('@/__swaps__/screens/Swap/components/SwapWarning', () => ({ SwapWarningView: 'Warning' }));
vi.mock('@/__swaps__/screens/Swap/constants', () => ({ BOTTOM_ACTION_BAR_HEIGHT: 80, CUSTOM_KEYBOARD_HEIGHT: 200 }));
vi.mock('@/components/animations/AnimatedSpinner', () => ({ AnimatedSpinner: 'Spinner' }));
vi.mock('@/components/animations/ButtonPressAnimation', () => ({ ButtonPressAnimation: 'Button' }));
vi.mock('@/__swaps__/screens/Swap/components/GasButton', () => ({
  GasButtonView: 'GasButtonView',
  GasFeeRow: 'GasFeeRow',
  SelectedGasView: 'SelectedGasView',
}));
vi.mock('@/__swaps__/screens/Swap/components/SwapActionButton', () => ({ SwapActionButton: 'SwapActionButton' }));
vi.mock('@/components/buttons/useHoldToActivate', () => ({
  useHoldToActivate: ({ onActivate, duration }: { onActivate: () => void; duration: number }) => ({
    holdProgress: { value: 0 },
    gestureHandlerProps: { onLongPressJS: onActivate, longPressDuration: duration },
  }),
}));
vi.mock('@/components/layout', () => ({ Page: 'Page' }));
vi.mock('@/components/navbar/Navbar', () => ({ navbarHeight: 50 }));
vi.mock('@/design-system', () => ({
  Box: 'Box',
  Separator: 'Separator',
  Text: 'Text',
  useColorMode: () => ({ isDarkMode: false }),
  useForegroundColor: () => 'blue',
}));
vi.mock('@/features/currency/utils/nativeDisplay', () => ({
  convertAmountToNativeDisplay: () => '$0',
  convertAmountToNativeDisplayWorklet: mocks.feeFormat,
}));
vi.mock('@/features/solana/data/mvpTrades', () => ({
  prepareSwapTrade: mocks.prepare,
  getSwapBalances: mocks.balances,
  useSolanaMvpExecutionStore: Object.assign((select: (state: unknown) => unknown) => select({ attempt: null }), {
    getState: () => ({ attempt: null }),
  }),
  checkMvpExecution: vi.fn(),
  executeMvpTrade: mocks.execute,
}));
vi.mock('@/features/solana/data/solanaBalancesStore', () => ({
  useSolanaWalletBalances: () => ({ data: mocks.balancesData }),
  refreshSolanaBalances: vi.fn(),
}));
vi.mock('@/features/solana/ui/SolanaSwapControls', () => ({
  appearance: () => ({ highContrastColor: { light: '#7057E8', dark: '#A18AFF' }, textColor: { light: '#FFFFFF', dark: '#FFFFFF' } }),
  SolanaSwapAmountControls: 'Controls',
  SolanaSwapCard: 'Card',
}));
vi.mock('@/features/solana/ui/SolanaSwapTokenRow', () => ({ SolanaSwapTokenRow: 'Token' }));
vi.mock('@/features/wallet/data/enableSolanaAccount', () => ({ requireEnabledSolanaAccount: () => ({ address: 'sol-account' }) }));
vi.mock('@/helpers/alert', () => ({ WrappedAlert: { alert: vi.fn() } }));
vi.mock('@/helpers/utilities', () => ({ handleSignificantDecimals: (amount: string) => amount }));
vi.mock('@/languages', () => ({
  t: (key: string) => key,
  l: {
    exchange: { quote_errors: { no_quote_available: 'No quote available' } },
    gas: { network_fee: 'Est. Network Fee' },
    swap: {
      gas: { network_fee: 'Network Fee' },
      actions: { enter_amount: 'Enter amount', insufficient_funds: 'Insufficient funds', fetching_prices: 'Fetching', review: 'Review' },
    },
  },
}));
vi.mock('@/logger', () => ({ logger: { warn: vi.fn() } }));
vi.mock('@/navigation/Navigation', () => ({ default: { goBack: mocks.navigate } }));
vi.mock('@/state/assets/userAssets', () => ({ useUserAssetsStore: () => null }));
vi.mock('@/state/assets/userAssetsStoreManager', () => ({ userAssetsStoreManager: () => 'USD' }));
vi.mock('@/utils/safeAreaInsetValues', () => ({ default: { top: 0, bottom: 0 } }));
vi.mock('@rainbow-me/solana-sdk', () => ({ isTerminalStatus: () => false, SolanaCluster: { Mainnet: 'mainnet' } }));

let tree: unknown;
const selection = { address: 'sol-account', inputAsset: 'base-eth', outputAsset: 'sol', amount: '0.001' } as Parameters<
  typeof SolanaSwapFlow
>[0]['selection'];
function render() {
  let renders = 0;
  do {
    renders += 1;
    if (renders > 25) throw new Error('Controller did not settle');
    hooks.cursor = 0;
    hooks.dirty = false;
    tree = SolanaSwapFlow({ selection, onBack: vi.fn() });
    hooks.effects.splice(0).forEach(effect => effect());
  } while (hooks.dirty);
}
async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  render();
}
function find(type: unknown, node: unknown = tree): Element | undefined {
  if (Array.isArray(node)) return node.map(child => find(type, child)).find(Boolean);
  if (!node || typeof node !== 'object' || !('props' in node)) return undefined;
  const element = node as Element;
  if (element.type === type) return element;
  return find(type, element.props.children ?? null);
}
function required(type: string): Element {
  const element = find(type);
  if (!element) throw new Error(`Missing ${type}`);
  return element;
}
function review() {
  return required('SwapActionButton');
}
function quote(inputAsset: 'base-eth' | 'bonk' = 'base-eth') {
  const input = inputAsset === 'base-eth' ? 1000000000000000n : 10000000000n;
  return {
    account: { address: 'sol-account' },
    inputAsset,
    outputAsset: 'sol',
    input,
    networkFeeLamports: inputAsset === 'base-eth' ? 0n : 15000n,
    prepared: {
      executionId: 'test-execution',
      review: {
        inputAmount: input,
        sponsorship: 'full',
        gasless: inputAsset === 'base-eth',
        expiresAt: BigInt(Math.floor(Date.now() / 1000)) + 60n,
        output: { asset: SWAP_ASSETS.sol.asset, decimals: 9, amount: 20000000n, minimumAmount: 19000000n },
      },
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  selection.inputAsset = 'base-eth';
  selection.amount = '0.001';
  hooks.slots = [];
  hooks.cursor = 0;
  hooks.effects = [];
  hooks.dirty = false;
  mocks.balancesData = undefined;
  mocks.feeFormat.mockClear();
  mocks.prepare.mockReset();
  mocks.execute.mockReset();
  mocks.balances.mockReset();
  mocks.balances.mockResolvedValue({ 'base-eth': 10000000000000000n, 'sol': 20000000n, 'usdc': 0n, 'bonk': 0n });
});
afterEach(() => {
  hooks.slots.forEach(slot => slot.cleanup?.());
  vi.useRealTimers();
});

it('recovers automatically after a slider-triggered quote failure without keeping the old output', async () => {
  mocks.prepare
    .mockResolvedValueOnce(quote())
    .mockRejectedValueOnce(new Error('Balance RPC unavailable'))
    .mockImplementation(async () => quote());
  render();
  await advance(500);
  expect((review().props.disabled as { value: boolean }).value).toBe(false);
  const controls = required('Controls');
  (controls.props.onInteraction as (active: boolean) => void)(true);
  render();
  (controls.props.onChange as (amount: string) => void)('0.002');
  render();
  expect((review().props.disabled as { value: boolean }).value).toBe(true);
  await advance(500);
  expect(find('Warning')).toBeDefined();
  // The output card receives zero after failure; no previous quote is offered for review.
  const outputCard = (node: unknown): Element | undefined => {
    if (Array.isArray(node)) return node.map(outputCard).find(Boolean);
    if (!node || typeof node !== 'object' || !('props' in node)) return undefined;
    const el = node as Element;
    return el.type === 'Card' && el.props.bottomInput ? el : outputCard(el.props.children);
  };
  expect(outputCard(tree)?.props.amount).toBe('0');
  await advance(12000);
  await advance(500);
  expect(mocks.prepare).toHaveBeenLastCalledWith('base-eth', 'sol', '0.002');
  expect((review().props.disabled as { value: boolean }).value).toBe(false);
  expect(find('Warning')).toBeUndefined();
});

it('does not let a background balance refresh disable a valid quote', async () => {
  mocks.prepare.mockImplementation(async () => quote());
  render();
  await advance(500);
  expect((review().props.disabled as { value: boolean }).value).toBe(false);
  mocks.balances.mockRejectedValue(new Error('Temporary balance refresh failure'));
  await advance(30000);
  await advance(500);
  expect((review().props.disabled as { value: boolean }).value).toBe(false);
  expect(find('Warning')).toBeUndefined();
});

it('requests a replacement when the slider or Max selects the same amount again', async () => {
  mocks.prepare.mockImplementation(async () => quote());
  render();
  await advance(500);
  expect((review().props.disabled as { value: boolean }).value).toBe(false);
  (required('Controls').props.onChange as (amount: string) => void)('0.001');
  render();
  expect((review().props.disabled as { value: boolean }).value).toBe(true);
  await advance(500);
  expect(mocks.prepare).toHaveBeenCalledTimes(2);
  expect((review().props.disabled as { value: boolean }).value).toBe(false);
});

it.each(['base-eth', 'bonk'] as const)('shows the user-paid %s fee in review, using SOL when fiat metadata is missing', async input => {
  selection.inputAsset = input;
  selection.amount = input === 'bonk' ? '100000' : '0.001';
  mocks.balances.mockResolvedValue({ 'base-eth': 10000000000000000n, 'sol': 20000000n, 'bonk': 10000000000n });
  mocks.prepare.mockResolvedValue(quote(input));
  render();
  await advance(500);
  (review().props.onPressJS as () => void)();
  render();
  function fee(node: unknown): Element | undefined {
    if (Array.isArray(node)) return node.map(fee).find(Boolean);
    if (!node || typeof node !== 'object' || !('props' in node)) return undefined;
    const el = node as Element;
    return el.props.testID === 'solana-swap-network-fee' ? el : fee(el.props.children);
  }
  expect(fee(tree)?.props.children).toBe(input === 'base-eth' ? '$0.00' : '0.000015 SOL');
});

it.each(['USD', 'EUR'])('uses SOL pricing only when balances match the selected currency (%s)', async balanceCurrency => {
  selection.inputAsset = 'bonk';
  selection.amount = '100000';
  mocks.balancesData = {
    address: selection.address,
    currency: balanceCurrency,
    total: '20',
    balances: [
      {
        assetId: 'solana:mainnet/native:So11111111111111111111111111111111111111111',
        symbol: 'SOL',
        name: 'Solana',
        amount: '0.1',
        value: '20',
        rawUnits: false,
      },
    ],
  };
  mocks.balances.mockResolvedValue({ sol: 20000000n, bonk: 10000000000n });
  mocks.prepare.mockResolvedValue(quote('bonk'));
  render();
  await advance(500);
  expect(mocks.feeFormat.mock.lastCall).toEqual(balanceCurrency === 'USD' ? ['0.003', 'USD', true] : undefined);
});

it('shows a read-only fee beside the shared action button before review and preserves hold-to-submit', async () => {
  selection.inputAsset = 'bonk';
  selection.amount = '100000';
  mocks.balances.mockResolvedValue({ sol: 20000000n, bonk: 10000000000n });
  mocks.prepare.mockResolvedValue(quote('bonk'));
  render();
  expect(required('GasButtonView').props.estimatedFee).toMatchObject({ props: { children: { props: { children: '--' } } } });
  await advance(500);
  const gas = required('GasButtonView');
  expect(gas.props.estimatedFee).toMatchObject({ props: { children: { props: { children: '0.000015 SOL' } } } });
  expect(gas.props.onPress).toBeUndefined();
  expect(review().props.icon).toEqual({ value: '􀕹' });
  expect(review().props.iconStyle).toEqual({ display: 'flex' });
  expect(review().props.onLongPressJS).toBeUndefined();
  (review().props.onPressJS as () => void)();
  render();
  expect(mocks.execute).not.toHaveBeenCalled();
  expect(find('GasButtonView')).toBeUndefined();
  expect(review().props.testID).toBe('solana-swap-confirm');
  expect(review().props.icon).toEqual({ value: '􀎽' });
  expect(review().props.onPressJS).toBeUndefined();
  expect(review().props.longPressDuration).toBe(400);
  (review().props.onLongPressJS as () => void)();
  await advance(0);
  expect(mocks.execute).toHaveBeenCalledTimes(1);
});

it('preserves the icon column while hiding its glyph during fetching, like EVM', async () => {
  mocks.prepare.mockImplementation(async () => quote());
  render();
  expect(review().props.label).toBe('Fetching');
  expect(review().props.icon).toEqual({ value: '' });
  expect(review().props.iconStyle).toEqual({ display: 'none' });
  await advance(500);
  expect(review().props.icon).toEqual({ value: '􀕹' });
  expect(review().props.iconStyle).toEqual({ display: 'flex' });
  (required('Controls').props.onChange as (amount: string) => void)('0.002');
  render();
  expect(review().props.icon).toEqual({ value: '' });
  expect(review().props.iconStyle).toEqual({ display: 'none' });
});

it.each(['base-eth', 'bonk'] as const)('marks %s network fees Free only when source gas is also sponsored', async input => {
  selection.inputAsset = input;
  selection.amount = input === 'bonk' ? '100000' : '0.001';
  mocks.balances.mockResolvedValue({ 'base-eth': 10000000000000000n, 'sol': 20000000n, 'bonk': 10000000000n });
  mocks.prepare.mockResolvedValue(quote(input));
  render();
  expect(required('GasButtonView').props.selectedGas).not.toMatchObject({ type: 'SelectedGasView' });
  await advance(500);
  const sponsored = input === 'base-eth';
  const gas = required('GasButtonView');
  expect(gas.props.selectedGas).toMatchObject(
    sponsored ? { type: 'SelectedGasView', props: { sponsored: true } } : { type: 'Text', props: { children: 'Network Fee' } }
  );
  expect(gas.props.estimatedFee).toMatchObject({
    props: {
      sponsored,
      children: {
        props: {
          children: sponsored ? '--' : '0.000015 SOL',
          style: { textDecorationLine: sponsored ? 'line-through' : undefined },
        },
      },
    },
  });
  (required('Controls').props.onChange as (amount: string) => void)(selection.amount);
  render();
  expect(required('GasButtonView').props.selectedGas).not.toMatchObject({ type: 'SelectedGasView' });
});
