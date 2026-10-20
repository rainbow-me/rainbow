import '../../../config/test/liveTokens';

import React, { act } from 'react';

import { NavigationRouteContext } from '@react-navigation/native';
import { type SharedValue } from 'react-native-reanimated';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Routes from '@/navigation/routesNames';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { type TokenData } from '@/state/liveTokens/types';

import { useLiveTokenSharedValue, useLiveTokenValue, type LiveTokenValueOptions } from './useLiveTokenValue';

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const defaults: LiveTokenValueOptions = { tokenId: 'mlb', fallback: '—', autoSubscribe: false };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask'] });
  useAppStateStore.setState('background');
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

afterAll(() => useLiveTokensStore.getState().reset(true));

describe.each(['shared', 'react'])('live token %s delivery', kind => {
  const useValue = kind === 'shared' ? useLiveTokenSharedValue : useLiveTokenValue;
  let value: string | SharedValue<string> = '';

  function Probe(props: LiveTokenValueOptions) {
    value = useValue(props);
    return null;
  }

  function readValue(): string {
    act(() => vi.advanceTimersByTime(0));
    return typeof value === 'string' ? value : value.value;
  }

  function render(props: Partial<LiveTokenValueOptions> = {}): void {
    act(() =>
      renderer.render(
        <NavigationRouteContext.Provider value={{ key: 'wallet', name: Routes.WALLET_SCREEN }}>
          {React.createElement(Probe, { ...defaults, ...props })}
        </NavigationRouteContext.Provider>,
        101,
        undefined,
        undefined
      )
    );
  }

  function publish(quote: TokenData): void {
    act(() => useLiveTokensStore.setState({ tokens: { mlb: quote } }));
  }

  it('defaults to price and follows token changes, including absent IDs', () => {
    useLiveTokensStore.setState({ tokens: { mlb: token('51'), nfl: token('27') } });
    render();
    expect(readValue()).toBe('51');
    render({ tokenId: 'nfl' });
    expect(readValue()).toBe('27');
    render({ tokenId: undefined });
    expect(readValue()).toBe('—');
    render({ tokenId: '' });
    expect(readValue()).toBe('—');
    render({ tokenId: 'missing' });
    expect(readValue()).toBe('—');
    act(() => useLiveTokensStore.setState({ tokens: { missing: token('19') } }));
    expect(readValue()).toBe('19');
  });

  it('applies changed selector context immediately and to subsequent quotes', () => {
    publish(token('10'));
    render();
    expect(readValue()).toBe('10');
    render({ selector: quote => String(Number(quote.price) * 2) });
    expect(readValue()).toBe('20');
    publish(token('5'));
    expect(readValue()).toBe('10');
  });

  it('applies a changed formatter to an unchanged selected value', () => {
    publish(token('51'));
    render({ format: price => `$${price}` });
    expect(readValue()).toBe('$51');
    render({ format: price => `€${price}` });
    expect(readValue()).toBe('€51');
    render();
    expect(readValue()).toBe('51');
  });

  it('updates the fallback without a quote and never formats it', () => {
    const format = vi.fn((price: string) => `$${price}`);
    render({ fallback: 'loading', format });
    expect(readValue()).toBe('loading');
    render({ fallback: 'unavailable', format });
    expect(readValue()).toBe('unavailable');
    expect(format).not.toHaveBeenCalled();
  });

  it('refreshes timestamp precedence with live quotes winning ties', () => {
    publish(token('51', 100));
    const format = (price: string) => `$${price}`;
    render({ fallback: '$52', fallbackUpdatedAt: 101, format });
    expect(readValue()).toBe('$52');
    render({ fallback: '$52', fallbackUpdatedAt: 100, format });
    expect(readValue()).toBe('$51');
    render({ fallback: '$54', fallbackUpdatedAt: 102, format });
    expect(readValue()).toBe('$54');
    publish(token('55', 101));
    expect(readValue()).toBe('$54');
    publish(token('55', 102));
    expect(readValue()).toBe('$55');
  });

  it('reuses formatted values across quote, selector and fallback changes', () => {
    const format = vi.fn((price: string) => (price === '0' ? '' : `$${price}`));
    publish(token('0'));
    render({ selector: quote => quote.price, format });
    expect(readValue()).toBe('');
    render({ selector: quote => quote.price, format });
    publish(token('0', 101));
    expect(readValue()).toBe('');
    expect(format).toHaveBeenCalledTimes(1);

    render({ format, fallback: '$99', fallbackUpdatedAt: 102 });
    expect(readValue()).toBe('$99');
    render({ format, fallback: '$99', fallbackUpdatedAt: 100 });
    expect(readValue()).toBe('');
    expect(format).toHaveBeenCalledTimes(1);

    publish(token('53', 103));
    expect(readValue()).toBe('$53');
    expect(format).toHaveBeenCalledTimes(2);
  });

  it('continues observing quotes when automatic price demand is disabled', () => {
    render({ autoSubscribe: true });
    publish(token('51'));
    expect(readValue()).toBe('51');
    render({ autoSubscribe: false });
    publish(token('53'));
    expect(readValue()).toBe('53');
  });

  it('keeps default price demand while selector, formatter and fallback inputs change', () => {
    const release = vi.fn();
    const subscribe = vi.spyOn(useLiveTokensStore.getState(), 'subscribeToToken').mockReturnValue(release);
    try {
      render({ autoSubscribe: undefined });
      render({
        autoSubscribe: undefined,
        selector: quote => quote.change.change1hPct,
        format: value => `${value}%`,
        fallback: 'loading',
        fallbackUpdatedAt: 100,
      });
      expect(subscribe).toHaveBeenCalledExactlyOnceWith(Routes.WALLET_SCREEN, defaults.tokenId);
      expect(release).not.toHaveBeenCalled();
      act(() => renderer.unmountComponentAtNode(101));
      expect(release).toHaveBeenCalledTimes(1);
    } finally {
      subscribe.mockRestore();
    }
  });
});

function token(price: string, timestamp = 100): TokenData {
  return {
    price,
    updateTime: new Date(timestamp * 1000).toISOString(),
    change: { change5mPct: '0', change1hPct: '1', change4hPct: '0', change12hPct: '0', change24hPct: '2' },
    marketData: { circulatingMarketCap: '0' },
    reliability: { metadata: { liquidityCap: '0' }, status: 'PRICE_RELIABILITY_STATUS_TRUSTED' },
  };
}
