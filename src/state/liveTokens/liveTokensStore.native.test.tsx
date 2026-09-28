import '../../../config/test/liveTokens';

import React, { act, useEffect, type ReactNode } from 'react';

import { NavigationRouteContext } from '@react-navigation/native';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import Routes, { type Route } from '@/navigation/routesNames';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { useLiveTokensStore, type LiveTokensData, type TokenData } from '@/state/liveTokens/liveTokensStore';
import * as priceAdapter from '@/state/liveTokens/polymarketAdapter';
import { useLiveTokenListSubscription } from '@/state/liveTokens/useLiveTokenListSubscription';
import { useNavigationStore } from '@/state/navigation/navigationStore';

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const fetchPrices = vi.spyOn(priceAdapter, 'fetchPolymarketPrices').mockResolvedValue({});
const FIRST_TOKEN = '1:polymarket:midpoint';
const SECOND_TOKEN = '2:polymarket:midpoint';
const THIRD_TOKEN = '3:polymarket:midpoint';
const price = (token: TokenData): string => token.price;

function Token({ id = FIRST_TOKEN, enabled = true }: { id?: string; enabled?: boolean }) {
  useLiveTokenValue({ tokenId: id, initialValue: '0', selector: price, autoSubscriptionEnabled: enabled });
  return null;
}

function List({ ids }: { ids: readonly string[] }) {
  const subscribe = useLiveTokenListSubscription();
  useEffect(() => subscribe(ids), [ids, subscribe]);
  return null;
}

function render(children: ReactNode, route: Route = Routes.WALLET_SCREEN): void {
  act(() => {
    renderer.render(
      <NavigationRouteContext.Provider value={{ key: route, name: route }}>{children}</NavigationRouteContext.Provider>,
      101,
      undefined,
      undefined
    );
  });
}

async function expectRequestedTokens(...tokenIds: string[]): Promise<void> {
  fetchPrices.mockClear();
  await useLiveTokensStore.getState().fetch(undefined, { force: true });
  if (tokenIds.length) {
    expect(fetchPrices).toHaveBeenCalledTimes(1);
    expect(fetchPrices).toHaveBeenCalledWith(tokenIds);
  } else {
    expect(fetchPrices).not.toHaveBeenCalled();
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'] });
  useAppStateStore.setState('background');
  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  useLiveTokensStore.setState({ tokens: {} });
  fetchPrices.mockClear();
});

afterEach(() => {
  act(() => {
    renderer.unmountComponentAtNode(101);
    vi.advanceTimersByTime(0);
    vi.runAllTicks();
  });
  vi.useRealTimers();
});

afterAll(() => {
  useLiveTokensStore.getState().reset(true);
  fetchPrices.mockRestore();
});

it('retains an overlapping token until its last component unmounts', async () => {
  render(<Token key="first" />);
  const state = useLiveTokensStore.getState();

  render(
    <>
      <Token key="first" />
      <Token key="second" />
    </>
  );
  expect(useLiveTokensStore.getState()).toBe(state);

  render(<Token key="second" />);
  expect(useLiveTokensStore.getState()).toBe(state);
  await expectRequestedTokens(FIRST_TOKEN);

  render(null);
  await expectRequestedTokens();
});

it('balances changes to the token and automatic subscription setting', async () => {
  render(<Token />);
  render(<Token id={SECOND_TOKEN} />);
  await expectRequestedTokens(SECOND_TOKEN);

  render(<Token id={SECOND_TOKEN} enabled={false} />);
  await expectRequestedTokens();

  render(<Token id={THIRD_TOKEN} enabled={false} />);
  render(<Token id={THIRD_TOKEN} />);
  await expectRequestedTokens(THIRD_TOKEN);
});

it('does not acquire a subscription for disabled price displays', () => {
  const subscribe = vi.spyOn(useLiveTokensStore.getState(), 'subscribeToToken');
  render(<Token enabled={false} />);
  render(<Token id={SECOND_TOKEN} enabled={false} />);
  render(null);
  expect(subscribe).not.toHaveBeenCalled();
  subscribe.mockRestore();
});

it('replaces list contents without disturbing another list or a single-token subscriber', async () => {
  render(
    <>
      <List key="first" ids={[FIRST_TOKEN, SECOND_TOKEN]} />
      <List key="second" ids={[SECOND_TOKEN, THIRD_TOKEN]} />
      <Token key="single" id={SECOND_TOKEN} />
    </>
  );
  await expectRequestedTokens(FIRST_TOKEN, SECOND_TOKEN, THIRD_TOKEN);

  render(
    <>
      <List key="first" ids={[SECOND_TOKEN]} />
      <Token key="single" id={SECOND_TOKEN} />
    </>
  );
  await expectRequestedTokens(SECOND_TOKEN);

  render(<Token key="single" id={SECOND_TOKEN} />);
  await expectRequestedTokens(SECOND_TOKEN);
});

it('ignores repeated, reordered and duplicate list entries', async () => {
  render(<List ids={[FIRST_TOKEN, SECOND_TOKEN]} />);
  const state = useLiveTokensStore.getState();
  render(<List ids={[SECOND_TOKEN, FIRST_TOKEN, SECOND_TOKEN]} />);
  expect(useLiveTokensStore.getState()).toBe(state);
  await expectRequestedTokens(FIRST_TOKEN, SECOND_TOKEN);

  render(<List ids={[]} />);
  await expectRequestedTokens();
});

it('moves subscriptions when a mounted consumer changes route', async () => {
  const children = (
    <>
      <Token />
      <List ids={[FIRST_TOKEN, SECOND_TOKEN]} />
    </>
  );
  render(children);
  render(children, Routes.DISCOVER_SCREEN);
  await expectRequestedTokens();
  act(() => useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN }));
  await expectRequestedTokens(FIRST_TOKEN, SECOND_TOKEN);
});

it('does not notify price selectors for inactive routes and follows updates after navigation', async () => {
  function Pages({ discoverToken }: { discoverToken: string }) {
    return (
      <>
        <Token />
        <NavigationRouteContext.Provider value={{ key: 'discover', name: Routes.DISCOVER_SCREEN }}>
          <Token id={discoverToken} />
        </NavigationRouteContext.Provider>
      </>
    );
  }

  render(<Pages discoverToken={SECOND_TOKEN} />);
  const selectPrices = vi.fn((state: { tokens: LiveTokensData }) => state.tokens);
  const unsubscribe = useLiveTokensStore.subscribe(selectPrices, vi.fn());
  selectPrices.mockClear();
  const walletQuery = useLiveTokensStore.getState().queryKey;
  try {
    render(<Pages discoverToken={THIRD_TOKEN} />);
    expect(selectPrices).not.toHaveBeenCalled();
    expect(useLiveTokensStore.getState().queryKey).toBe(walletQuery);
    await expectRequestedTokens(FIRST_TOKEN);

    act(() => useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN }));
    await expectRequestedTokens(THIRD_TOKEN);

    render(<Pages discoverToken={SECOND_TOKEN} />);
    await expectRequestedTokens(SECOND_TOKEN);
  } finally {
    unsubscribe();
  }
});

it('fetches the new route when navigation shortens the refresh interval', async () => {
  render(
    <>
      <Token />
      <NavigationRouteContext.Provider value={{ key: 'event', name: Routes.POLYMARKET_EVENT_SCREEN }}>
        <Token id={SECOND_TOKEN} />
      </NavigationRouteContext.Provider>
    </>
  );

  await act(async () => {
    useAppStateStore.setState('active');
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(fetchPrices).toHaveBeenLastCalledWith([FIRST_TOKEN]);

  await act(async () => vi.advanceTimersByTimeAsync(3000));
  fetchPrices.mockClear();

  await act(async () => {
    useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(fetchPrices).toHaveBeenCalledTimes(1);
  expect(fetchPrices).toHaveBeenCalledWith([SECOND_TOKEN]);
});
