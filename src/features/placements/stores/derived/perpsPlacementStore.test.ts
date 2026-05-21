import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { useRemoteConfigStore } from '@/model/remoteConfig';

import { FIXTURE_V2_PLACEMENTS_BY_ID } from '../../__fixtures__/placements';
import { PLACEMENT_IDS } from '../../constants';
import { usePlacementsStore } from '../placementsStore';
import { usePerpsPlacementStore } from './perpsPlacementStore';

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
      discover_placements_enabled: true,
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

describe('perpsPlacementStore', () => {
  afterEach(() => {
    usePlacementsStore.setState({ placementsById: {} });
    useHyperliquidMarketsStore.setState({ markets: {} });
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        perps_enabled: false,
      },
    }));
    usePlacementsStore.getState().reset(true);
    useHyperliquidMarketsStore.getState().reset(true);
  });

  it('hydrates placement refs with matching Hyperliquid markets and drops missing markets', () => {
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
        perps_enabled: true,
      },
    }));
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });
    useHyperliquidMarketsStore.setState({
      markets: {
        BTC: createPerpMarket('BTC'),
        ETH: createPerpMarket('ETH'),
      },
    });

    const placement = usePerpsPlacementStore.getState();

    expect(placement.placement?.id).toBe(PLACEMENT_IDS.PERPS);
    expect(placement.items.map(item => item.ref.id)).toEqual(['BTC', 'ETH']);
    expect(placement.items.map(item => item.market.symbol)).toEqual(['BTC', 'ETH']);
  });

  it('returns an empty placement result when the perps gate is off', () => {
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });
    useHyperliquidMarketsStore.setState({
      markets: {
        BTC: createPerpMarket('BTC'),
      },
    });

    expect(usePerpsPlacementStore.getState()).toEqual({
      isLoading: false,
      items: [],
      placement: undefined,
    });
  });
});

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
