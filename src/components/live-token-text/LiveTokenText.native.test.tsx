import '../../../config/test/liveTokens';

import React, { act } from 'react';

import { NavigationRouteContext } from '@react-navigation/native';
import { type SharedValue } from 'react-native-reanimated';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLiveTokenSharedValue, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import Routes from '@/navigation/routesNames';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { useLiveTokensStore, type TokenData } from '@/state/liveTokens/liveTokensStore';
import * as priceAdapter from '@/state/liveTokens/polymarketAdapter';
import { useNavigationStore } from '@/state/navigation/navigationStore';

const PRICE_REQUEST_SETTLE_MS = 300;
const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const price = (token: TokenData): string => token.price;
const change = (token: TokenData): string => token.change.change24hPct;
type ValueParams = Parameters<typeof useLiveTokenValue>[0];
const defaults: ValueParams = {
  tokenId: 'mlb',
  initialValue: '—',
  selector: price,
  autoSubscriptionEnabled: false,
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'] });
  useLiveTokensStore.setState({ tokens: {} });
});
afterEach(() => {
  act(() => {
    renderer.unmountComponentAtNode(101);
    vi.advanceTimersByTime(0);
    vi.runAllTicks();
  });
  vi.useRealTimers();
});

describe.each(['shared', 'react'])('live token %s delivery', kind => {
  const useValue = kind === 'shared' ? useLiveTokenSharedValue : useLiveTokenValue;
  let value: string | SharedValue<string> = '';

  function Probe(props: ValueParams): null {
    value = useValue(props);
    return null;
  }

  function readValue(): string {
    act(() => vi.advanceTimersByTime(0));
    return typeof value === 'string' ? value : value.value;
  }

  function render(props: Partial<ValueParams> = {}): void {
    act(() =>
      renderer.render(
        <NavigationRouteContext.Provider value={{ key: 'sports', name: Routes.SPORTS_SCREEN }}>
          {React.createElement(Probe, { ...defaults, ...props })}
        </NavigationRouteContext.Provider>,
        101,
        undefined,
        undefined
      )
    );
  }

  it('selects cached quotes on mount and follows the current token and field on updates', () => {
    useLiveTokensStore.setState({
      tokens: { mlb: token('51'), nfl: token('27') },
    });
    render();
    expect(readValue()).toBe('51');
    render({ tokenId: 'nfl' });
    act(() => useLiveTokensStore.setState({ tokens: { mlb: token('51'), nfl: token('27') } }));
    expect(readValue()).toBe('27');
    render({ tokenId: 'nfl', selector: change });
    act(() => useLiveTokensStore.setState({ tokens: { nfl: token('27') } }));
    expect(readValue()).toBe('2');

    render({ tokenId: 'missing' });
    act(() => useLiveTokensStore.setState({ tokens: {} }));
    expect(readValue()).toBe('—');
    act(() => useLiveTokensStore.setState({ tokens: { missing: token('19') } }));
    expect(readValue()).toBe('19');
    act(() => renderer.unmountComponentAtNode(101));
    render({ tokenId: 'missing' });
    expect(readValue()).toBe('19');
  });

  if (kind === 'shared') {
    it('keeps an in-flight quote when an equivalent inline selector replaces the previous one', async () => {
      const tokenId = '11:polymarket:midpoint';
      let finishFetch: ((data: Record<string, TokenData>) => void) | undefined;
      const pendingFetch = new Promise<Record<string, TokenData>>(resolve => {
        finishFetch = resolve;
      });
      const fetchPrices = vi.spyOn(priceAdapter, 'fetchPolymarketPrices').mockReturnValue(pendingFetch);
      const previousAppState = useAppStateStore.getState();
      const previousRoute = useNavigationStore.getState().activeRoute;
      useAppStateStore.setState('active');
      useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });

      try {
        render({
          tokenId,
          autoSubscriptionEnabled: true,
          selector: token => token.price,
        });
        await act(async () => {
          await vi.advanceTimersByTimeAsync(PRICE_REQUEST_SETTLE_MS);
        });
        expect(fetchPrices).toHaveBeenCalledTimes(1);
        expect(fetchPrices).toHaveBeenLastCalledWith([tokenId]);

        render({
          tokenId,
          autoSubscriptionEnabled: true,
          selector: token => token.price,
        });
        await act(async () => {
          await vi.advanceTimersByTimeAsync(PRICE_REQUEST_SETTLE_MS);
        });
        expect(fetchPrices).toHaveBeenCalledTimes(1);
      } finally {
        await act(async () => {
          finishFetch?.({});
          await pendingFetch;
        });
        act(() => renderer.unmountComponentAtNode(101));
        useAppStateStore.setState(previousAppState);
        useNavigationStore.setState({ activeRoute: previousRoute });
        fetchPrices.mockRestore();
        act(() => vi.runAllTicks());
      }
    });
  }

  it('prefers the newer value, with the live quote winning equal timestamps', () => {
    useLiveTokensStore.setState({ tokens: { mlb: token('51', 100) } });
    render({ initialValue: '52', initialValueLastUpdated: 101 });
    expect(readValue()).toBe('52');
    act(() => useLiveTokensStore.setState({ tokens: { mlb: token('53', 101) } }));
    expect(readValue()).toBe('53');
    render({ initialValue: '54', initialValueLastUpdated: 102 });
    act(() => useLiveTokensStore.setState({ tokens: { mlb: token('55', 101) } }));
    expect(readValue()).toBe('54');
  });
});

function token(price: string, timestamp = 100): TokenData {
  return {
    price,
    updateTime: new Date(timestamp * 1000).toISOString(),
    change: {
      change5mPct: '0',
      change1hPct: '0',
      change4hPct: '0',
      change12hPct: '0',
      change24hPct: '2',
    },
    marketData: { circulatingMarketCap: '0' },
    reliability: {
      metadata: { liquidityCap: '0' },
      status: 'PRICE_RELIABILITY_STATUS_TRUSTED',
    },
  };
}
