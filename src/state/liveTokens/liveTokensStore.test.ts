import Routes from '@/navigation/routesNames';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { fetchPolymarketPrices } from '@/state/liveTokens/polymarketAdapter';
import { useNavigationStore } from '@/state/navigation/navigationStore';

jest.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: jest.requireActual('@storesjs/stores').createBaseStore(() => ({ activeRoute: 'WalletScreen' })),
}));
jest.mock('@/state/assets/userAssetsStoreManager', () => ({
  userAssetsStoreManager: jest.requireActual('@storesjs/stores').createBaseStore(() => ({ currency: 'usd' })),
}));
jest.mock('@/state/assets/userAssets', () => ({
  useUserAssetsStore: { getState: () => ({ getUserAsset: () => undefined, updateTokens: jest.fn() }) },
}));
jest.mock('@/state/liveTokens/polymarketAdapter', () => ({
  isPolymarketToken: () => true,
  fetchPolymarketPrices: jest.fn(async () => ({})),
}));
jest.mock('@/state/liveTokens/hyperliquidPriceService', () => ({ fetchHyperliquidPrices: jest.fn() }));
jest.mock('@/state/liveTokens/hyperliquidAdapter', () => ({ isHyperliquidToken: () => false }));
jest.mock('@/features/currency/utils/nativeDisplay', () => ({}));
jest.mock('@/helpers/utilities', () => ({}));
jest.mock('@/references/constants', () => ({ ETH_ADDRESS: 'eth', WETH_ADDRESS: 'weth' }));
jest.mock('@/resources/platform/client', () => ({ getPlatformClient: jest.fn() }));

const first = Symbol('first');
const second = Symbol('second');

beforeEach(() => {
  useLiveTokensStore.getState().clear();
  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  jest.clearAllMocks();
});

afterAll(() => useLiveTokensStore.getState().reset(true));

describe('live token ownership', () => {
  it('retains overlapping demand until the last consumer releases it', async () => {
    const { setSubscription, removeSubscription } = useLiveTokensStore.getState();
    setSubscription(first, Routes.WALLET_SCREEN, ['shared', 'first']);
    setSubscription(second, Routes.WALLET_SCREEN, ['shared', 'second']);
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPolymarketPrices).toHaveBeenLastCalledWith(['first', 'second', 'shared']);

    removeSubscription(first);
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPolymarketPrices).toHaveBeenLastCalledWith(['second', 'shared']);

    removeSubscription(second);
    jest.clearAllMocks();
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPolymarketPrices).not.toHaveBeenCalled();
    expect(useLiveTokensStore.getState().subscriptions.size).toBe(0);
  });

  it('replaces a full visible set without accumulating or publishing equal demand', async () => {
    const { setSubscription } = useLiveTokensStore.getState();
    setSubscription(first, Routes.WALLET_SCREEN, ['a', 'b']);
    const previous = useLiveTokensStore.getState().subscriptions;
    setSubscription(first, Routes.WALLET_SCREEN, ['b', 'a', 'a']);
    expect(useLiveTokensStore.getState().subscriptions).toBe(previous);

    setSubscription(first, Routes.WALLET_SCREEN, ['b', 'c']);
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPolymarketPrices).toHaveBeenLastCalledWith(['b', 'c']);
    expect(previous.get(first)?.tokenIds).toEqual(['a', 'b']);

    setSubscription(first, Routes.WALLET_SCREEN, []);
    expect(useLiveTokensStore.getState().subscriptions.size).toBe(0);
  });

  it('selects only the active route without changing other consumers', async () => {
    const { setSubscription } = useLiveTokensStore.getState();
    setSubscription(first, Routes.WALLET_SCREEN, ['wallet']);
    setSubscription(second, Routes.DISCOVER_SCREEN, ['discover']);
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPolymarketPrices).toHaveBeenLastCalledWith(['wallet']);

    useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPolymarketPrices).toHaveBeenLastCalledWith(['discover']);
    expect(useLiveTokensStore.getState().subscriptions.size).toBe(2);
  });
});
