import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { useRemoteConfigStore } from '@/model/remoteConfig';

import { usePlacementsStore, type PlacementsById } from '../placementsStore';
import { getPerpsPlacementStore } from './perpsPlacementStore';

jest.mock('@/env', () => ({
  ...jest.requireActual('@/env'),
  IS_TEST: false,
}));

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => 'app'),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  getFirestore: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock('@/model/remoteConfig', () => ({
  useRemoteConfigStore: mockCreateStore({
    config: {
      perps_enabled: false,
    },
    getRemoteConfigKey(this: { config: Record<string, boolean> }, key: string) {
      return this.config[key];
    },
    isConfigReady: () => true,
  }),
}));

jest.mock('@/features/perps/stores/hyperliquidMarketsStore', () => ({
  useHyperliquidMarketsStore: mockCreateStore({
    markets: {},
    getStatus: () => false,
    reset: () => undefined,
  }),
}));

const usePerpsTopPlacementStore = getPerpsPlacementStore('perps_top');

describe('perpsPlacementStore', () => {
  afterEach(() => {
    usePlacementsStore.setState({ placementsById: {} });
    useHyperliquidMarketsStore.setState({ markets: {} });
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        perps_enabled: false,
      },
    }));
    usePlacementsStore.getState().reset(true);
    useHyperliquidMarketsStore.getState().reset(true);
  });

  it('hydrates placement item ids with matching Hyperliquid markets and drops missing markets', () => {
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        perps_enabled: true,
      },
    }));
    usePlacementsStore.setState({ placementsById: TEST_PLACEMENTS_BY_ID });
    useHyperliquidMarketsStore.setState({
      markets: {
        BTC: createPerpMarket('BTC'),
        ETH: createPerpMarket('ETH'),
      },
    });

    const placement = usePerpsTopPlacementStore.getState();

    expect(placement.placement?.id).toBe('perps_top');
    expect(placement.items.map(item => item.id)).toEqual(['BTC', 'ETH']);
    expect(placement.items.map(item => item.market.symbol)).toEqual(['BTC', 'ETH']);
  });

  it('returns an empty placement result when the perps gate is off', () => {
    usePlacementsStore.setState({ placementsById: TEST_PLACEMENTS_BY_ID });
    useHyperliquidMarketsStore.setState({
      markets: {
        BTC: createPerpMarket('BTC'),
      },
    });

    expect(usePerpsTopPlacementStore.getState()).toEqual({
      isLoading: false,
      items: [],
      placement: undefined,
    });
  });
});

const TEST_PLACEMENTS_BY_ID: PlacementsById = {
  perps_top: {
    id: 'perps_top',
    version: 2,
    source: 'hyperliquid',
    type: 'perp',
    items: [{ id: 'BTC' }, { id: 'ETH' }],
  },
};

function createPerpMarket(symbol: string): PerpMarketWithMetadata {
  return {
    id: symbol.length,
    symbol,
    baseSymbol: symbol,
    price: '100',
    midPrice: '100',
    previousDayPrice: '90',
    priceChange: {
      '1h': '1',
      '24h': '10',
    },
    volume: {
      '24h': '100000',
    },
    maxLeverage: 10,
    decimals: 2,
    fundingRate: '0',
    openInterest: '1000',
    dex: '',
  };
}

function mockCreateStore<T extends object>(initialState: T) {
  const { subscribeWithSelector } = jest.requireActual<typeof import('zustand/middleware')>('zustand/middleware');
  const { createStore } = jest.requireActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  return createStore(subscribeWithSelector(() => initialState));
}
