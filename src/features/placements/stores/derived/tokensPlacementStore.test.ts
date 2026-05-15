import { useRemoteConfigStore } from '@/model/remoteConfig';
import { fetchExternalToken } from '@/resources/assets/externalAssetsQuery';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

import { FIXTURE_V2_PLACEMENTS_BY_ID } from '../../__fixtures__/placements';
import { PLACEMENT_IDS } from '../../constants';
import { usePlacementsStore } from '../placementsStore';
import { useTokenRefsStore, useTokensPlacementStore } from './tokensPlacementStore';

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
    },
    getRemoteConfigKey(this: { config: Record<string, boolean> }, key: string) {
      return this.config[key];
    },
  }),
}));

jest.mock('@/state/assets/userAssetsStoreManager', () => ({
  userAssetsStoreManager: mockCreateStore({
    currency: 'USD',
  }),
}));

jest.mock('@/resources/assets/externalAssetsQuery', () => ({
  fetchExternalToken: jest.fn(),
}));

describe('tokensPlacementStore', () => {
  beforeEach(() => {
    (fetchExternalToken as jest.Mock).mockImplementation(({ address, chainId }) =>
      Promise.resolve({
        address,
        chainId,
        isNativeAsset: false,
        native: { change: '', price: { amount: '1', display: '$1.00' } },
        networks: [],
        symbol: address.slice(2, 6).toUpperCase(),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    usePlacementsStore.setState({ placementsById: {} });
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: true,
      },
    }));
    userAssetsStoreManager.setState({ currency: 'USD' });
    usePlacementsStore.getState().reset(true);
    useTokenRefsStore.getState().reset(true);
  });

  it('fetches token refs once per unique rainbow token placement ref', async () => {
    const tokensPlacement = FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.TOKENS];
    if (!tokensPlacement) throw new Error('Missing tokens fixture');

    usePlacementsStore.setState({
      placementsById: {
        ...FIXTURE_V2_PLACEMENTS_BY_ID,
        [PLACEMENT_IDS.TOKENS]: {
          ...tokensPlacement,
          items: [...tokensPlacement.items, tokensPlacement.items[0]],
        },
      },
    });
    userAssetsStoreManager.setState({ currency: 'USD' });

    const tokenRefs = usePlacementsStore.getState().getAllRefIds({ source: 'rainbow', type: 'token' });
    expect(tokenRefs).toHaveLength(tokensPlacement.items.length);
    useTokenRefsStore.getState().reset(true);
    (fetchExternalToken as jest.Mock).mockClear();
    await useTokenRefsStore.getState().fetch({ currency: 'USD', tokenRefs }, { force: true });

    expect(fetchExternalToken).toHaveBeenCalledTimes(tokensPlacement.items.length);
    expect(fetchExternalToken).toHaveBeenCalledWith({
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      chainId: 1,
      currency: 'USD',
    });
  });

  it('hydrates the tokens placement from fetched token assets', async () => {
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    const tokenRefs = usePlacementsStore.getState().getAllRefIds({ source: 'rainbow', type: 'token' });
    (fetchExternalToken as jest.Mock).mockClear();
    await useTokenRefsStore.getState().fetch({ currency: 'USD', tokenRefs }, { force: true });

    const placement = useTokensPlacementStore.getState();
    expect(placement.placement?.id).toBe(PLACEMENT_IDS.TOKENS);
    expect(placement.items).toHaveLength(FIXTURE_V2_PLACEMENTS_BY_ID[PLACEMENT_IDS.TOKENS].items.length);
  });

  it('returns an empty placement result when the placements gate is off', () => {
    useRemoteConfigStore.setState(state => ({
      config: {
        ...state.config,
        discover_placements_enabled: false,
      },
    }));
    usePlacementsStore.setState({ placementsById: FIXTURE_V2_PLACEMENTS_BY_ID });

    expect(useTokensPlacementStore.getState()).toEqual({
      isLoading: false,
      items: [],
      placement: undefined,
    });
  });
});

function mockCreateStore<T extends object>(initialState: T) {
  const { subscribeWithSelector } = jest.requireActual<typeof import('zustand/middleware')>('zustand/middleware');
  const { createStore } = jest.requireActual<typeof import('zustand/vanilla')>('zustand/vanilla');
  return createStore(subscribeWithSelector(() => initialState));
}
