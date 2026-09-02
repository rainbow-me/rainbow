import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { useSwapInputsController } from './useSwapInputsController';

type Effect = () => void | (() => void);

type MutableValue<T> = {
  value: T;
  modify: (update: (value: T) => T) => void;
};

type MockSharedValue = MutableValue<unknown> & {
  animationActive: boolean;
};

type TestAsset = {
  address: string;
  chainId: number;
  decimals: number;
  maxSwappableAmount: string;
  networks: Record<number, { decimals: number }>;
  price: { value: number };
  uniqueId: string;
};

type TestQuote = {
  buyAmountMinusFees: string;
  buyTokenAsset: { price: { value: number } };
  sellAmount: string;
  sellTokenAsset: { price: { value: number } };
};

const mockEffectCleanups: Array<() => void> = [];
const mockGetQuote = jest.fn<(...args: unknown[]) => Promise<TestQuote>>();
const mockSharedValues: MockSharedValue[] = [];
const mockTrack = jest.fn();
const mockUIWorkQueue: Array<() => void> = [];
const mockSwapState: { quote: TestQuote | null; slippage: string; source: string } = {
  quote: null,
  slippage: '0.5',
  source: 'auto',
};
let mockDelayUIWork = false;
let mockIsOnUI = false;

function mockMutable<T>(value: T): MutableValue<T> {
  return {
    value,
    modify(update) {
      this.value = update(this.value);
    },
  };
}

function mockRegisterEffect(effect: Effect): void {
  const cleanup = effect();
  if (cleanup) mockEffectCleanups.push(cleanup);
}

function mockScheduleUI(work: () => void): void {
  const runWorklet = () => {
    const wasOnUI = mockIsOnUI;
    mockIsOnUI = true;
    try {
      work();
    } finally {
      mockIsOnUI = wasOnUI;
    }
  };

  if (mockDelayUIWork) {
    mockUIWorkQueue.push(runWorklet);
  } else {
    runWorklet();
  }
}

jest.mock('react', () => ({
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: Effect) => mockRegisterEffect(effect),
  useRef: <T>(initialValue: T) => ({ current: initialValue }),
}));

jest.mock('react-native-reanimated', () => ({
  Easing: { linear: 'linear' },
  runOnJS: (callback: unknown) => callback,
  runOnUI:
    (callback: (...args: unknown[]) => void) =>
    (...args: unknown[]) =>
      mockScheduleUI(() => callback(...args)),
  useAnimatedReaction: jest.fn(),
  useDerivedValue: (derive: () => unknown) => ({
    get value() {
      return derive();
    },
  }),
  useSharedValue: (initialValue: unknown) => {
    let currentValue = initialValue;
    const setValue = (value: unknown) => {
      currentValue = value;
      sharedValue.animationActive = mockIsAnimation(value);
    };
    const sharedValue: MockSharedValue = {
      animationActive: false,
      get value() {
        return currentValue;
      },
      set value(value: unknown) {
        if (mockIsOnUI) setValue(value);
        else mockScheduleUI(() => setValue(value));
      },
      modify(update) {
        const applyUpdate = () => setValue(update(currentValue));
        if (mockIsOnUI) applyUpdate();
        else mockScheduleUI(applyUpdate);
      },
    };
    mockRegisterEffect(() => () => {
      mockScheduleUI(() => {
        sharedValue.animationActive = false;
      });
    });
    mockSharedValues.push(sharedValue);
    return sharedValue;
  },
  withRepeat: (animation: unknown) => ({ __animation: 'repeat', animation }),
  withSequence: (...animations: unknown[]) => ({ __animation: 'sequence', animations }),
  withSpring: (value: unknown) => value,
  withTiming: (value: unknown) => ({ __animation: 'timing', value }),
}));

jest.mock('react-native-turbo-haptics', () => ({ triggerHaptics: jest.fn() }));

jest.mock('use-debounce', () => ({
  useDebouncedCallback: (callback: unknown) => callback,
}));

jest.mock('@/__swaps__/screens/Swap/constants', () => ({
  SCRUBBER_WIDTH: 100,
  SLIDER_COLLAPSED_HEIGHT: 1,
  SLIDER_HEIGHT: 1,
  SLIDER_ROUND_THRESHOLD_END: 0.99,
  SLIDER_ROUND_THRESHOLD_START: 0.01,
  SLIDER_WIDTH: 100,
  snappySpringConfig: {},
}));

jest.mock('@/__swaps__/utils/decimalFormatter', () => ({
  valueBasedDecimalFormatter: ({ amount }: { amount: unknown }) => String(amount),
}));

jest.mock('@/__swaps__/utils/flipAssets', () => ({
  getInputValuesForSliderPositionWorklet: () => ({
    inputAmount: 0,
    inputNativeValue: 0,
    outputAmount: 0,
    outputNativeValue: 0,
  }),
}));

jest.mock('@/__swaps__/utils/swaps', () => ({
  buildQuoteParams: (params: unknown) => ({ params }),
  clamp: (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum),
  getQuotePrice: () => 1,
  trimTrailingZeros: (value: unknown) => String(value),
}));

jest.mock('@/analytics', () => ({
  analytics: {
    event: { swapsReceivedQuote: 'swaps.received_quote' },
    track: (...args: unknown[]) => mockTrack(...args),
  },
}));

jest.mock('@/components/animations/animationConfigs', () => ({
  SPRING_CONFIGS: { sliderConfig: {} },
}));

jest.mock('@/features/currency/utils/nativeDisplay', () => ({
  addSymbolToNativeDisplayWorklet: (value: unknown) => String(value),
  convertAmountToNativeDisplayWorklet: (value: unknown) => String(value),
}));

jest.mock('@/framework/core/safeMath', () => ({
  divWorklet: (left: unknown, right: unknown) => Number(left) / Number(right),
  equalWorklet: (left: unknown, right: unknown) => Number(left) === Number(right),
  greaterThanWorklet: (left: unknown, right: unknown) => Number(left) > Number(right),
  isNumberStringWorklet: (value: unknown) => !Number.isNaN(Number(value)),
  mulWorklet: (left: unknown, right: unknown) => Number(left) * Number(right),
  toFixedWorklet: (value: unknown) => String(value),
}));

jest.mock('@/framework/ui/utils/addCommasToNumber', () => ({
  addCommasToNumber: (value: unknown) => String(value),
}));

jest.mock('@/helpers/utilities', () => ({
  convertRawAmountToDecimalFormat: (value: unknown) => String(value),
  handleSignificantDecimalsWorklet: (value: unknown) => String(value),
}));

jest.mock('@/logger', () => ({ logger: { debug: jest.fn() } }));

jest.mock('@/state/swaps/swapsStore', () => ({
  swapsStore: {
    getState: () => mockSwapState,
    setState: (update: Partial<typeof mockSwapState>) => Object.assign(mockSwapState, update),
  },
}));

jest.mock('@/state/wallets/walletsStore', () => ({
  getAccountAddress: () => '0x0000000000000000000000000000000000000001',
}));

jest.mock('@rainbow-me/swaps', () => ({
  getCrosschainQuote: jest.fn(),
  getQuote: (...args: unknown[]) => mockGetQuote(...args),
}));

jest.mock('./analyticsTrackQuoteFailed', () => ({ analyticsTrackQuoteFailed: jest.fn() }));

jest.mock('./useSwapNavigation', () => ({
  NavigationSteps: { INPUT_ELEMENT_FOCUSED: 1 },
}));

describe('useSwapInputsController quote-owner lifecycle', () => {
  beforeEach(() => {
    mockDelayUIWork = false;
    mockEffectCleanups.length = 0;
    mockGetQuote.mockReset();
    mockIsOnUI = false;
    mockSharedValues.length = 0;
    mockSwapState.quote = null;
    mockTrack.mockClear();
    mockUIWorkQueue.length = 0;
  });

  afterEach(() => {
    mockDelayUIWork = false;
    unmountController();
    flushUIWork();
  });

  it('continues to apply and poll a quote while its owner is mounted', async () => {
    const nextQuote = createQuote();
    mockGetQuote.mockResolvedValue(nextQuote);
    const mounted = createController();

    mounted.controller.fetchQuote();
    await flushPromises();

    expect(mounted.quote.value).toBe(nextQuote);
    expect(mockSwapState.quote).toBe(nextQuote);
    expect(getTimerClock().animationActive).toBe(true);
    expect(mockTrack).toHaveBeenCalledTimes(1);
  });

  it('ignores a pending quote and refuses later requests after its owner unmounts', async () => {
    const pendingQuote = createDeferred<TestQuote>();
    const currentQuote = createQuote();
    mockGetQuote.mockReturnValue(pendingQuote.promise);
    const obsolete = createController();

    obsolete.controller.fetchQuote();
    expect(mockGetQuote).toHaveBeenCalledTimes(1);

    unmountController();
    mockSwapState.quote = currentQuote;
    pendingQuote.resolve(createQuote());
    await flushPromises();

    expect(obsolete.quote.value).toBeNull();
    expect(mockSwapState.quote).toBe(currentQuote);
    expect(getTimerClock().animationActive).toBe(false);
    expect(mockTrack).not.toHaveBeenCalled();

    obsolete.controller.fetchQuote();
    obsolete.controller.quoteFetchingInterval.start();
    await flushPromises();

    expect(mockGetQuote).toHaveBeenCalledTimes(1);
    expect(getTimerClock().animationActive).toBe(false);
  });

  it('does not restart polling when a pending request rejects after unmount', async () => {
    const pendingQuote = createDeferred<TestQuote>();
    mockGetQuote.mockReturnValue(pendingQuote.promise);
    const obsolete = createController();

    obsolete.controller.fetchQuote();
    unmountController();
    mockDelayUIWork = true;
    pendingQuote.reject(new Error('request failed after dismissal'));
    await flushPromises();

    expect(mockUIWorkQueue).toHaveLength(0);
    expect(getTimerClock().animationActive).toBe(false);
    expect(mockSwapState.quote).toBeNull();
  });

  it('blocks queued publication and leaves polling stopped after cleanup', async () => {
    const pendingQuote = createDeferred<TestQuote>();
    const obsoleteQuote = createQuote();
    const currentQuote = createQuote();
    mockGetQuote.mockReturnValue(pendingQuote.promise);
    const obsolete = createController();

    obsolete.controller.fetchQuote();
    mockDelayUIWork = true;
    pendingQuote.resolve(obsoleteQuote);
    await flushPromises();
    expect(mockUIWorkQueue).toHaveLength(1);

    mockSwapState.quote = currentQuote;
    unmountController();
    flushUIWork();

    expect(mockSwapState.quote).toBe(currentQuote);
    // The quote work was already ahead of cleanup in the UI queue; Reanimated's later cleanup must leave its timer inactive.
    expect(getTimerClock().animationActive).toBe(false);
  });
});

function createAsset(uniqueId: string, address: string): TestAsset {
  return {
    address,
    chainId: 8453,
    decimals: 18,
    maxSwappableAmount: '10',
    networks: { 8453: { decimals: 18 } },
    price: { value: 1 },
    uniqueId,
  };
}

function createController() {
  const inputAsset = createAsset('INPUT', '0x0000000000000000000000000000000000000001');
  const outputAsset = createAsset('OUTPUT', '0x0000000000000000000000000000000000000002');
  const quote = mockMutable<TestQuote | null>(null);
  // React hooks are mocked above so the controller can be exercised without adding a renderer dependency.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const controller = useSwapInputsController({
    currentCurrency: 'USD',
    focusedInput: mockMutable('inputAmount'),
    initialValues: {
      focusedInput: 'inputAmount',
      inputAmount: 1,
      inputAsset,
      inputMethod: 'inputAmount',
      inputNativeValue: 1,
      lastTypedInput: 'inputAmount',
      outputAsset,
      percentageToSell: 0.5,
    },
    inputProgress: mockMutable(1),
    internalSelectedInputAsset: mockMutable(inputAsset),
    internalSelectedOutputAsset: mockMutable(outputAsset),
    isFetching: mockMutable(false),
    isQuoteStale: mockMutable(0),
    lastTypedInput: mockMutable('inputAmount'),
    outputProgress: mockMutable(1),
    quote,
    sliderPressProgress: mockMutable(1),
    sliderXPosition: mockMutable(50),
  } as never);

  return { controller, quote };
}

function createQuote(): TestQuote {
  return {
    buyAmountMinusFees: '2',
    buyTokenAsset: { price: { value: 1 } },
    sellAmount: '1',
    sellTokenAsset: { price: { value: 1 } },
  };
}

function createDeferred<T>() {
  let reject: (reason?: unknown) => void = () => undefined;
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    reject = rejectPromise;
    resolve = resolvePromise;
  });

  return { promise, reject, resolve };
}

function flushUIWork(): void {
  while (mockUIWorkQueue.length) mockUIWorkQueue.shift()?.();
}

function getTimerClock(): MockSharedValue {
  const timerClock = mockSharedValues[mockSharedValues.length - 1];
  if (!timerClock) throw new Error('Expected useAnimatedInterval to create its timer clock');
  return timerClock;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function mockIsAnimation(value: unknown): boolean {
  return typeof value === 'object' && value !== null && '__animation' in value;
}

function unmountController(): void {
  mockEffectCleanups.splice(0).forEach(cleanup => cleanup());
}
