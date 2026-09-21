import React, { act, type ReactNode } from 'react';

import { type SharedValue } from 'react-native-reanimated';

import { useLiveTokenSharedValue, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import Routes from '@/navigation/routesNames';
import { useLiveTokensStore, type TokenData } from '@/state/liveTokens/liveTokensStore';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const renderer = require('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev') as {
  render: (element: ReactNode, containerTag: number) => void;
  unmountComponentAtNode: (containerTag: number) => void;
};

const mockSharedWrites = jest.fn();

jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initialValue: string) =>
    jest.requireActual('react').useState(() => {
      let value = initialValue;
      return {
        get value() {
          return value;
        },
        set value(next: string) {
          mockSharedWrites(next);
          value = next;
        },
      };
    })[0],
}));
jest.mock('@/state/liveTokens/liveTokensStore', () => ({
  useLiveTokensStore: jest.requireActual('@storesjs/stores').createBaseStore(() => ({ tokens: {} })),
}));
jest.mock('@/state/liveTokens/useLiveTokenSubscription', () => ({ useLiveTokenSubscription: () => jest.fn() }));
jest.mock('@/design-system', () => ({}));
jest.mock('@/theme/ThemeContext', () => ({}));

type ValueParams = Parameters<typeof useLiveTokenValue>[0];
const price = (token: TokenData) => token.price;
const change = (token: TokenData) => token.change.change24hPct;
const defaults: ValueParams = { tokenId: 'mlb', initialValue: '—', selector: price, autoSubscriptionEnabled: false };

beforeEach(() => {
  useLiveTokensStore.setState({ tokens: {}, subscriptions: new Map(), status: 'idle' });
  mockSharedWrites.mockClear();
});
afterEach(() => {
  act(() => renderer.unmountComponentAtNode(101));
});

describe.each(['shared', 'react'] as const)('live token %s value', kind => {
  const useValue = kind === 'shared' ? useLiveTokenSharedValue : useLiveTokenValue;
  let value: string | SharedValue<string>;
  const renders = jest.fn();

  function Probe(props: ValueParams) {
    value = useValue(props);
    renders(readValue());
    return null;
  }

  function readValue() {
    return typeof value === 'string' ? value : value.value;
  }

  function render(props: Partial<ValueParams> = {}) {
    act(() => renderer.render(React.createElement(Probe, { ...defaults, ...props }), 101));
  }

  beforeEach(() => renders.mockClear());

  it('uses cached quotes on the first render, including a category revisit', () => {
    useLiveTokensStore.setState({ tokens: { mlb: token('51'), nfl: token('27') } });

    for (const tokenId of ['mlb', 'nfl', 'mlb']) {
      render({ tokenId });
      expect(renders).toHaveBeenLastCalledWith(tokenId === 'mlb' ? '51' : '27');
      act(() => renderer.unmountComponentAtNode(101));
    }
    expect(renders.mock.calls.flat()).not.toContain('—');
  });

  it('changes token and selector without resetting a cached value to the fallback', () => {
    useLiveTokensStore.setState({ tokens: { mlb: token('51'), nfl: token('27') } });
    render();
    mockSharedWrites.mockClear();

    render({ tokenId: 'nfl' });
    expect(readValue()).toBe('27');
    render({ tokenId: 'nfl', selector: change });
    expect(readValue()).toBe('2');
    expect(mockSharedWrites).not.toHaveBeenCalledWith('—');
  });

  it('uses the fallback until a quote arrives and does not borrow another token’s quote', () => {
    render();
    expect(readValue()).toBe('—');
    render({ initialValue: 'Waiting' });
    expect(readValue()).toBe('Waiting');
    act(() => useLiveTokensStore.setState({ tokens: { mlb: token('51') } }));
    expect(readValue()).toBe('51');
    render({ tokenId: 'nfl' });
    expect(readValue()).toBe('—');
  });

  it('prefers the newer value, with the live quote winning equal timestamps', () => {
    useLiveTokensStore.setState({ tokens: { mlb: token('51', 100) } });
    render({ initialValue: '52', initialValueLastUpdated: 101 });
    expect(renders).toHaveBeenLastCalledWith('52');
    act(() => useLiveTokensStore.setState({ tokens: { mlb: token('53', 101) } }));
    expect(readValue()).toBe('53');
    render({ initialValue: '54', initialValueLastUpdated: 102 });
    expect(readValue()).toBe('54');
  });

  it('does not format unchanged token data when unrelated store fields change', () => {
    const selectPrice = jest.fn(price);
    useLiveTokensStore.setState({ tokens: { mlb: token('51'), nfl: token('27') } });
    render({ selector: selectPrice });
    selectPrice.mockClear();
    renders.mockClear();
    mockSharedWrites.mockClear();

    act(() => useLiveTokensStore.setState(state => ({ tokens: { ...state.tokens, nfl: token('28') } })));
    act(() =>
      useLiveTokensStore.setState({ subscriptions: new Map([[Symbol('other'), { route: Routes.SPORTS_SCREEN, tokenIds: ['nfl'] }]]) })
    );
    act(() => useLiveTokensStore.setState({ status: 'loading' }));

    expect(selectPrice).not.toHaveBeenCalled();
    expect(renders).not.toHaveBeenCalled();
    expect(mockSharedWrites).not.toHaveBeenCalled();
  });

  it('recomputes changed token data but delivers only changed text', () => {
    const selectPrice = jest.fn(price);
    useLiveTokensStore.setState({ tokens: { mlb: token('51') } });
    render({ selector: selectPrice });
    selectPrice.mockClear();
    renders.mockClear();
    mockSharedWrites.mockClear();

    act(() => useLiveTokensStore.setState(state => ({ tokens: { ...state.tokens, mlb: token('51', 101) } })));
    expect(selectPrice).toHaveBeenCalledTimes(1);
    expect(renders).not.toHaveBeenCalled();
    expect(mockSharedWrites).not.toHaveBeenCalled();

    act(() => useLiveTokensStore.setState(state => ({ tokens: { ...state.tokens, mlb: token('52', 102) } })));
    expect(selectPrice).toHaveBeenCalledTimes(2);
    expect(readValue()).toBe('52');
    expect(renders).toHaveBeenCalledTimes(kind === 'react' ? 1 : 0);
    expect(mockSharedWrites).toHaveBeenCalledTimes(kind === 'shared' ? 1 : 0);
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
