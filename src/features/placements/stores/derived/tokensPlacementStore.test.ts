import { fetchExternalToken } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { QueryStatuses } from '@/state/internal/queryStore/types';

import { usePlacementsStore, type PlacementsById } from '../placementsStore';
import { getTokensPlacementStore, useTokenRefsStore } from './tokensPlacementStore';

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

jest.mock('@/state/assets/userAssetsStoreManager', () => ({
  userAssetsStoreManager: mockCreateStore({
    currency: 'USD',
  }),
}));

jest.mock('@/resources/assets/externalAssetsQuery', () => ({
  fetchExternalToken: jest.fn(),
}));

const useTokensTopPlacementStore = getTokensPlacementStore('tokens_top');

describe('tokensPlacementStore', () => {
  beforeEach(() => {
    (fetchExternalToken as jest.Mock).mockImplementation(({ address, chainId }) =>
      Promise.resolve({
        address,
        chainId,
        colors: { primary: '#808088' },
        decimals: 18,
        iconUrl: undefined,
        icon_url: undefined,
        isNativeAsset: false,
        name: address,
        native: { change: '', price: { amount: '1', display: '$1.00' } },
        networks: {},
        price: { relativeChange24h: 0, value: 1 },
        symbol: address.slice(0, 4).toUpperCase(),
        transferable: true,
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    usePlacementsStore.setState({ placementsById: {} });
    userAssetsStoreManager.setState({ currency: 'USD' });
    usePlacementsStore.getState().reset(true);
    useTokenRefsStore.getState().reset(true);
  });

  it('fetches token refs once per unique rainbow token placement id', async () => {
    const tokensPlacement = TEST_PLACEMENTS_BY_ID.tokens_top;
    if (!tokensPlacement) throw new Error('Missing tokens placement');

    usePlacementsStore.setState({
      placementsById: {
        ...TEST_PLACEMENTS_BY_ID,
        tokens_top: {
          ...tokensPlacement,
          items: [...tokensPlacement.items, tokensPlacement.items[0]],
        },
      },
    });

    const tokenRefs = usePlacementsStore.getState().getAllRefIds({ source: 'rainbow', type: 'token' });
    expect(tokenRefs).toHaveLength(tokensPlacement.items.length);
    (fetchExternalToken as jest.Mock).mockClear();

    await useTokenRefsStore.getState().fetch({ currency: 'USD', tokenRefs }, { force: true });

    expect(fetchExternalToken).toHaveBeenCalledTimes(tokensPlacement.items.length);
    expect(fetchExternalToken).toHaveBeenCalledWith({
      address: 'eth',
      chainId: 1,
      currency: 'USD',
    });
  });

  it('hydrates the tokens placement from fetched token assets', async () => {
    usePlacementsStore.setState({ placementsById: TEST_PLACEMENTS_BY_ID });

    const tokenRefs = usePlacementsStore.getState().getAllRefIds({ source: 'rainbow', type: 'token' });
    await useTokenRefsStore.getState().fetch({ currency: 'USD', tokenRefs }, { force: true });

    const placement = useTokensTopPlacementStore.getState();
    expect(placement.placement?.id).toBe('tokens_top');
    expect(placement.items).toHaveLength(TEST_PLACEMENTS_BY_ID.tokens_top?.items.length);
  });

  it('shows loading while token placement refs have not hydrated yet', () => {
    usePlacementsStore.setState({
      placementsById: {},
      status: QueryStatuses.Idle,
    });

    expect(useTokensTopPlacementStore.getState()).toEqual({
      isLoading: true,
      items: [],
      placement: undefined,
    });
  });
});

const TEST_PLACEMENTS_BY_ID: PlacementsById = {
  tokens_top: {
    id: 'tokens_top',
    version: 2,
    source: 'rainbow',
    type: 'token',
    items: [{ id: 'eth:1' }, { id: 'btc:1' }],
  },
};

function mockCreateStore<T extends object>(initialState: T) {
  const { subscribeWithSelector } = jest.requireActual<typeof import('zustand/middleware')>('zustand/middleware');
  const { createStore } = jest.requireActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  return createStore(subscribeWithSelector(() => initialState));
}
