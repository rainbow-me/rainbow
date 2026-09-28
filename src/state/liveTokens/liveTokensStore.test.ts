import '../../../config/test/storeEnvironment';

import Routes from '@/navigation/routesNames';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import * as priceAdapter from '@/state/liveTokens/polymarketAdapter';
import { useNavigationStore } from '@/state/navigation/navigationStore';

const fetchPrices = jest.spyOn(priceAdapter, 'fetchPolymarketPrices').mockResolvedValue({});

const first = Symbol('first');
const second = Symbol('second');

beforeEach(() => {
  useLiveTokensStore.getState().clear();
  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  fetchPrices.mockClear();
});

afterAll(() => {
  useLiveTokensStore.getState().reset(true);
  fetchPrices.mockRestore();
});

describe('live token ownership', () => {
  it('retains overlapping demand until the last consumer releases it', async () => {
    const { setSubscription, removeSubscription } = useLiveTokensStore.getState();
    setSubscription(first, Routes.WALLET_SCREEN, ['1:polymarket:midpoint', '2:polymarket:midpoint']);
    setSubscription(second, Routes.WALLET_SCREEN, ['1:polymarket:midpoint', '3:polymarket:midpoint']);
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPrices).toHaveBeenLastCalledWith(['1:polymarket:midpoint', '2:polymarket:midpoint', '3:polymarket:midpoint']);

    removeSubscription(first);
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPrices).toHaveBeenLastCalledWith(['1:polymarket:midpoint', '3:polymarket:midpoint']);

    removeSubscription(second);
    fetchPrices.mockClear();
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPrices).not.toHaveBeenCalled();
    expect(useLiveTokensStore.getState().subscriptions.size).toBe(0);
  });

  it('replaces a full visible set without accumulating or publishing equal demand', async () => {
    const { setSubscription } = useLiveTokensStore.getState();
    setSubscription(first, Routes.WALLET_SCREEN, ['1:polymarket:midpoint', '2:polymarket:midpoint']);
    const previous = useLiveTokensStore.getState().subscriptions;
    setSubscription(first, Routes.WALLET_SCREEN, ['2:polymarket:midpoint', '1:polymarket:midpoint', '1:polymarket:midpoint']);
    expect(useLiveTokensStore.getState().subscriptions).toBe(previous);

    setSubscription(first, Routes.WALLET_SCREEN, ['2:polymarket:midpoint', '3:polymarket:midpoint']);
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPrices).toHaveBeenLastCalledWith(['2:polymarket:midpoint', '3:polymarket:midpoint']);
    expect(previous.get(first)?.tokenIds).toEqual(['1:polymarket:midpoint', '2:polymarket:midpoint']);

    setSubscription(first, Routes.WALLET_SCREEN, []);
    expect(useLiveTokensStore.getState().subscriptions.size).toBe(0);
  });

  it('selects only the active route without changing other consumers', async () => {
    const { setSubscription } = useLiveTokensStore.getState();
    setSubscription(first, Routes.WALLET_SCREEN, ['4:polymarket:midpoint']);
    setSubscription(second, Routes.DISCOVER_SCREEN, ['5:polymarket:midpoint']);
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPrices).toHaveBeenLastCalledWith(['4:polymarket:midpoint']);

    useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
    await useLiveTokensStore.getState().fetch(undefined, { force: true });
    expect(fetchPrices).toHaveBeenLastCalledWith(['5:polymarket:midpoint']);
    expect(useLiveTokensStore.getState().subscriptions.size).toBe(2);
  });
});
