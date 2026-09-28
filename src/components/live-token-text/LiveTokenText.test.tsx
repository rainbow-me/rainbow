import '../../../config/test/storeEnvironment';

import React, { act } from 'react';

import { NavigationRouteContext } from '@react-navigation/native';
import { type SharedValue } from 'react-native-reanimated';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';

import { useLiveTokenSharedValue, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import Routes from '@/navigation/routesNames';
import { useLiveTokensStore, type TokenData } from '@/state/liveTokens/liveTokensStore';

const renderer = jest.requireActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const price = (token: TokenData): string => token.price;
const change = (token: TokenData): string => token.change.change24hPct;
type ValueParams = Parameters<typeof useLiveTokenValue>[0];
const defaults: ValueParams = { tokenId: 'mlb', initialValue: '—', selector: price, autoSubscriptionEnabled: false };

beforeEach(() => useLiveTokensStore.getState().clear());
afterEach(() => act(() => renderer.unmountComponentAtNode(101)));

describe.each(['shared', 'react'])('live token %s delivery', kind => {
  const useValue = kind === 'shared' ? useLiveTokenSharedValue : useLiveTokenValue;
  let value: string | SharedValue<string> = '';

  function Probe(props: ValueParams): null {
    value = useValue(props);
    return null;
  }

  function readValue(): string {
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

  it('uses cached values across token, field, and mount changes', () => {
    useLiveTokensStore.setState({ tokens: { mlb: token('51'), nfl: token('27') } });
    render();
    expect(readValue()).toBe('51');
    render({ tokenId: 'nfl' });
    expect(readValue()).toBe('27');
    render({ tokenId: 'nfl', selector: change });
    expect(readValue()).toBe('2');

    render({ tokenId: 'missing' });
    expect(readValue()).toBe('—');
    act(() => useLiveTokensStore.setState({ tokens: { missing: token('19') } }));
    expect(readValue()).toBe('19');
    act(() => renderer.unmountComponentAtNode(101));
    render({ tokenId: 'missing' });
    expect(readValue()).toBe('19');
  });

  it('prefers the newer value, with the live quote winning equal timestamps', () => {
    useLiveTokensStore.setState({ tokens: { mlb: token('51', 100) } });
    render({ initialValue: '52', initialValueLastUpdated: 101 });
    expect(readValue()).toBe('52');
    act(() => useLiveTokensStore.setState({ tokens: { mlb: token('53', 101) } }));
    expect(readValue()).toBe('53');
    render({ initialValue: '54', initialValueLastUpdated: 102 });
    expect(readValue()).toBe('54');
  });
});

function token(price: string, timestamp = 100): TokenData {
  return {
    price,
    updateTime: new Date(timestamp * 1000).toISOString(),
    change: { change5mPct: '0', change1hPct: '0', change4hPct: '0', change12hPct: '0', change24hPct: '2' },
    marketData: { circulatingMarketCap: '0' },
    reliability: { metadata: { liquidityCap: '0' }, status: 'PRICE_RELIABILITY_STATUS_TRUSTED' },
  };
}
