import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Address } from 'viem';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { TransactionDirection } from '@/entities/transactions';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { invalidateAddressNftsQueries } from '@/resources/nfts';
import { type UserAsset } from '@/state/assets/types';
import { userAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useAssetUpdatesStore } from '@/state/assetUpdates/assetUpdates';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { staleBalancesStore } from '@/state/staleBalances';
import { getUniqueId } from '@/utils/ethereumUtils';

import { watchAssetUpdates } from './useWatchAssetUpdates';

const TEST_ADDRESS = '0x123';

const mockGetAssetUpdates = jest.fn<() => Promise<{ data: { result: Record<string, UserAsset> } }>>(async () => ({
  data: {
    result: {},
  },
}));

const mockGetTokenAddresses = jest.fn(() => new Set<string>());
const mockClaimablesFetch = jest.fn<(params?: unknown, options?: unknown) => Promise<null>>(async () => null);
const mockRewardsFetch = jest.fn<(params?: unknown, options?: unknown) => Promise<null>>(async () => null);
const mockPositionsFetch = jest.fn<(params?: unknown, options?: unknown) => Promise<null>>(async () => null);
const mockUserAssetsFetch = jest.fn<(params?: unknown, options?: unknown) => Promise<null>>(async () => null);

jest.mock('@/resources/platform/client', () => ({
  getPlatformClient: () => ({
    get: mockGetAssetUpdates,
  }),
}));

jest.mock('@/config/experimentalHooks', () => ({}));

jest.mock('@/resources/nfts', () => ({
  invalidateAddressNftsQueries: jest.fn(),
}));

jest.mock('@/redux/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({
      settings: {
        nativeCurrency: 'ETH',
      },
    }),
  },
}));

jest.mock('@/state/wallets/walletsStore', () => ({
  getAccountAddress: () => '0x123',
  useAccountAddress: () => '0x123',
  useWalletsStore: {
    getState: () => ({
      accountAddress: '0x123',
    }),
    subscribe: jest.fn(),
  },
}));

jest.mock('@/state/swaps/swapsStore', () => ({
  useSwapsStore: {
    getState: () => ({
      preferredNetwork: undefined,
    }),
  },
}));

jest.mock('@/utils/ethereumUtils', () => ({
  getUniqueId: (address: string, chainId: number) => `${address}_${chainId}`,
}));

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
  },
}));

const BASE_TOKEN_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
const OPTIMISM_TOKEN_ADDRESS = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address;
const MAINNET_TOKEN_ADDRESS = '0xcccccccccccccccccccccccccccccccccccccccc' as Address;

describe('watchAssetUpdates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
    resetStores();

    userAssetsStore.getState(TEST_ADDRESS);
    userAssetsStore.setState(
      state => ({
        ...state,
        fetch: async (params, options) => mockUserAssetsFetch(params, options),
      }),
      false,
      TEST_ADDRESS
    );
    usePositionsStore.setState(state => ({
      ...state,
      fetch: async (params, options) => mockPositionsFetch(params, options),
      getTokenAddresses: mockGetTokenAddresses,
    }));
    useClaimablesStore.setState(state => ({
      ...state,
      fetch: async (params, options) => mockClaimablesFetch(params, options),
    }));
    useRewardsBalanceStore.setState(state => ({
      ...state,
      fetch: async (params, options) => mockRewardsFetch(params, options),
    }));
    jest.mocked(invalidateAddressNftsQueries).mockImplementation(async () => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('deduplicates watched hashes and preserves the watched array reference when nothing new is added', () => {
    seedUserAssets([
      buildParsedSearchAsset({
        address: BASE_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 8453,
        name: 'Token A',
        network: 'Base',
        symbol: 'TKNA',
      }),
    ]);

    const transaction = buildAssetUpdateTransaction();
    useAssetUpdatesStore.getState().addWatchedTransactions({
      address: TEST_ADDRESS,
      transactions: [transaction, transaction],
    });

    const watchedTransactions = useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS];
    expect(watchedTransactions).toHaveLength(1);

    useAssetUpdatesStore.getState().addWatchedTransactions({
      address: TEST_ADDRESS,
      transactions: [transaction],
    });

    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toBe(watchedTransactions);
  });

  it('updates every touched chain and clears the watch once all expected balances change', async () => {
    seedUserAssets([
      buildParsedSearchAsset({
        address: BASE_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 8453,
        name: 'Token A',
        network: 'Base',
        symbol: 'TKNA',
      }),
      buildParsedSearchAsset({
        address: OPTIMISM_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 10,
        name: 'Token B',
        network: 'Optimism',
        symbol: 'TKNB',
      }),
      buildParsedSearchAsset({
        address: MAINNET_TOKEN_ADDRESS,
        balanceAmount: '7',
        chainId: 1,
        name: 'Token C',
        network: 'Ethereum',
        symbol: 'TKNC',
      }),
    ]);

    const transaction = buildAssetUpdateTransaction();
    useAssetUpdatesStore.getState().addWatchedTransactions({
      address: TEST_ADDRESS,
      transactions: [transaction],
    });
    mockGetAssetUpdates.mockResolvedValue({
      data: {
        result: {
          [`${BASE_TOKEN_ADDRESS}:8453`]: buildUserAsset({
            address: BASE_TOKEN_ADDRESS,
            chainId: 8453,
            name: 'Token A',
            network: 'Base',
            quantity: '1000000000000000000',
            symbol: 'TKNA',
            value: '1',
          }),
          [`${OPTIMISM_TOKEN_ADDRESS}:10`]: buildUserAsset({
            address: OPTIMISM_TOKEN_ADDRESS,
            chainId: 10,
            name: 'Token B',
            network: 'Optimism',
            quantity: '1000000000000000000',
            symbol: 'TKNB',
            value: '1',
          }),
        },
      },
    });
    mockGetAssetUpdates.mockClear();

    await watchAssetUpdates({
      address: TEST_ADDRESS,
      currency: 'ETH',
      staleBalances: undefined,
      watchedTransactions: useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS] ?? [],
    });

    expect(mockGetAssetUpdates).toHaveBeenCalledWith(
      '/assets/GetAssetUpdates',
      expect.objectContaining({
        params: {
          address: TEST_ADDRESS,
          chainIds: '8453,10',
          currency: 'ETH',
          forcedTokens: `${BASE_TOKEN_ADDRESS}:8453,${OPTIMISM_TOKEN_ADDRESS}:10`,
        },
        timeout: 20000,
      })
    );
    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toBeUndefined();
    expect(mockPositionsFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockClaimablesFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockRewardsFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(invalidateAddressNftsQueries).toHaveBeenCalledWith(TEST_ADDRESS);

    const userAssets = userAssetsStore.getState(TEST_ADDRESS).userAssets;
    expect(userAssets.get(getUniqueId(BASE_TOKEN_ADDRESS, 8453))?.balance.amount).toBe('1');
    expect(userAssets.get(getUniqueId(OPTIMISM_TOKEN_ADDRESS, 10))?.balance.amount).toBe('1');
    expect(userAssets.get(getUniqueId(MAINNET_TOKEN_ADDRESS, 1))?.balance.amount).toBe('7');
  });

  it('keeps watching until every expected balance has changed, then clears on a later poll', async () => {
    seedUserAssets([
      buildParsedSearchAsset({
        address: BASE_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 8453,
        name: 'Token A',
        network: 'Base',
        symbol: 'TKNA',
      }),
      buildParsedSearchAsset({
        address: OPTIMISM_TOKEN_ADDRESS,
        balanceAmount: '2',
        chainId: 10,
        name: 'Token B',
        network: 'Optimism',
        symbol: 'TKNB',
      }),
    ]);

    const transaction = buildAssetUpdateTransaction();
    useAssetUpdatesStore.getState().addWatchedTransactions({
      address: TEST_ADDRESS,
      transactions: [transaction],
    });
    mockGetAssetUpdates
      .mockResolvedValueOnce({
        data: {
          result: {
            [`${BASE_TOKEN_ADDRESS}:8453`]: buildUserAsset({
              address: BASE_TOKEN_ADDRESS,
              chainId: 8453,
              name: 'Token A',
              network: 'Base',
              quantity: '1000000000000000000',
              symbol: 'TKNA',
              value: '1',
            }),
            [`${OPTIMISM_TOKEN_ADDRESS}:10`]: buildUserAsset({
              address: OPTIMISM_TOKEN_ADDRESS,
              chainId: 10,
              name: 'Token B',
              network: 'Optimism',
              quantity: '2000000000000000000',
              symbol: 'TKNB',
              value: '2',
            }),
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          result: {
            [`${BASE_TOKEN_ADDRESS}:8453`]: buildUserAsset({
              address: BASE_TOKEN_ADDRESS,
              chainId: 8453,
              name: 'Token A',
              network: 'Base',
              quantity: '1000000000000000000',
              symbol: 'TKNA',
              value: '1',
            }),
            [`${OPTIMISM_TOKEN_ADDRESS}:10`]: buildUserAsset({
              address: OPTIMISM_TOKEN_ADDRESS,
              chainId: 10,
              name: 'Token B',
              network: 'Optimism',
              quantity: '1000000000000000000',
              symbol: 'TKNB',
              value: '1',
            }),
          },
        },
      });

    await watchAssetUpdates({
      address: TEST_ADDRESS,
      currency: 'ETH',
      staleBalances: undefined,
      watchedTransactions: useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS] ?? [],
    });

    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toHaveLength(1);
    expect(mockPositionsFetch).not.toHaveBeenCalled();
    expect(mockClaimablesFetch).not.toHaveBeenCalled();
    expect(mockRewardsFetch).not.toHaveBeenCalled();
    expect(invalidateAddressNftsQueries).not.toHaveBeenCalled();

    const userAssets = userAssetsStore.getState(TEST_ADDRESS).userAssets;
    expect(userAssets.get(getUniqueId(BASE_TOKEN_ADDRESS, 8453))?.balance.amount).toBe('1');
    expect(userAssets.get(getUniqueId(OPTIMISM_TOKEN_ADDRESS, 10))?.balance.amount).toBe('2');

    await watchAssetUpdates({
      address: TEST_ADDRESS,
      currency: 'ETH',
      staleBalances: undefined,
      watchedTransactions: useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS] ?? [],
    });

    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toBeUndefined();
    expect(mockPositionsFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockClaimablesFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockRewardsFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(invalidateAddressNftsQueries).toHaveBeenCalledWith(TEST_ADDRESS);

    const finalUserAssets = userAssetsStore.getState(TEST_ADDRESS).userAssets;
    expect(finalUserAssets.get(getUniqueId(BASE_TOKEN_ADDRESS, 8453))?.balance.amount).toBe('1');
    expect(finalUserAssets.get(getUniqueId(OPTIMISM_TOKEN_ADDRESS, 10))?.balance.amount).toBe('1');
  });

  it('preserves newer watched transactions added while an asset update poll is in flight', async () => {
    seedUserAssets([
      buildParsedSearchAsset({
        address: BASE_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 8453,
        name: 'Token A',
        network: 'Base',
        symbol: 'TKNA',
      }),
      buildParsedSearchAsset({
        address: OPTIMISM_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 10,
        name: 'Token B',
        network: 'Optimism',
        symbol: 'TKNB',
      }),
    ]);

    const firstTransaction = buildAssetUpdateTransaction({
      hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    });
    const secondTransaction = buildAssetUpdateTransaction({
      hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
    });
    const response = createDeferred<{ data: { result: Record<string, UserAsset> } }>();

    useAssetUpdatesStore.getState().addWatchedTransactions({
      address: TEST_ADDRESS,
      transactions: [firstTransaction],
    });
    mockGetAssetUpdates.mockImplementation(async () => response.promise);

    const watchPromise = watchAssetUpdates({
      address: TEST_ADDRESS,
      currency: 'ETH',
      staleBalances: undefined,
      watchedTransactions: useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS] ?? [],
    });

    useAssetUpdatesStore.getState().addWatchedTransactions({
      address: TEST_ADDRESS,
      transactions: [secondTransaction],
    });

    response.resolve({
      data: {
        result: {
          [`${BASE_TOKEN_ADDRESS}:8453`]: buildUserAsset({
            address: BASE_TOKEN_ADDRESS,
            chainId: 8453,
            name: 'Token A',
            network: 'Base',
            quantity: '1000000000000000000',
            symbol: 'TKNA',
            value: '1',
          }),
          [`${OPTIMISM_TOKEN_ADDRESS}:10`]: buildUserAsset({
            address: OPTIMISM_TOKEN_ADDRESS,
            chainId: 10,
            name: 'Token B',
            network: 'Optimism',
            quantity: '1000000000000000000',
            symbol: 'TKNB',
            value: '1',
          }),
        },
      },
    });
    await watchPromise;

    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toEqual([
      expect.objectContaining({
        transaction: expect.objectContaining({
          hash: secondTransaction.hash,
        }),
      }),
    ]);
  });

  it('captures the baseline from the transaction snapshot before a partial refresh reaches user assets', async () => {
    seedUserAssets([
      buildParsedSearchAsset({
        address: BASE_TOKEN_ADDRESS,
        balanceAmount: '1',
        chainId: 8453,
        name: 'Token A',
        network: 'Base',
        symbol: 'TKNA',
      }),
      buildParsedSearchAsset({
        address: OPTIMISM_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 10,
        name: 'Token B',
        network: 'Optimism',
        symbol: 'TKNB',
      }),
    ]);

    useAssetUpdatesStore.getState().addWatchedTransactions({
      address: TEST_ADDRESS,
      transactions: [
        buildAssetUpdateTransaction({
          buyBalanceAmount: '0',
          sellBalanceAmount: '0',
        }),
      ],
    });

    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toEqual([
      expect.objectContaining({
        baselineQuantitiesByAssetId: {
          [getUniqueId(BASE_TOKEN_ADDRESS, 8453)]: '0',
          [getUniqueId(OPTIMISM_TOKEN_ADDRESS, 10)]: '0',
        },
      }),
    ]);

    mockGetAssetUpdates.mockResolvedValue({
      data: {
        result: {
          [`${BASE_TOKEN_ADDRESS}:8453`]: buildUserAsset({
            address: BASE_TOKEN_ADDRESS,
            chainId: 8453,
            name: 'Token A',
            network: 'Base',
            quantity: '1000000000000000000',
            symbol: 'TKNA',
            value: '1',
          }),
          [`${OPTIMISM_TOKEN_ADDRESS}:10`]: buildUserAsset({
            address: OPTIMISM_TOKEN_ADDRESS,
            chainId: 10,
            name: 'Token B',
            network: 'Optimism',
            quantity: '1000000000000000000',
            symbol: 'TKNB',
            value: '1',
          }),
        },
      },
    });

    await watchAssetUpdates({
      address: TEST_ADDRESS,
      currency: 'ETH',
      staleBalances: undefined,
      watchedTransactions: useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS] ?? [],
    });

    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toBeUndefined();
  });

  it('removes only timed-out watches and forces a full user-assets fetch', async () => {
    seedUserAssets([
      buildParsedSearchAsset({
        address: BASE_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 8453,
        name: 'Token A',
        network: 'Base',
        symbol: 'TKNA',
      }),
      buildParsedSearchAsset({
        address: OPTIMISM_TOKEN_ADDRESS,
        balanceAmount: '0',
        chainId: 10,
        name: 'Token B',
        network: 'Optimism',
        symbol: 'TKNB',
      }),
    ]);

    const timedOutTransaction = buildAssetUpdateTransaction({
      hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    const activeTransaction = buildAssetUpdateTransaction({
      hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });

    useAssetUpdatesStore.getState().addWatchedTransactions({
      address: TEST_ADDRESS,
      transactions: [timedOutTransaction, activeTransaction],
    });
    useAssetUpdatesStore.setState(state => ({
      watchedTransactions: {
        ...state.watchedTransactions,
        [TEST_ADDRESS]:
          state.watchedTransactions[TEST_ADDRESS]?.map((watch, index) =>
            index === 0 ? { ...watch, pollingStartedAt: watch.pollingStartedAt - 31_000 } : watch
          ) ?? [],
      },
    }));
    mockGetAssetUpdates.mockResolvedValue({
      data: {
        result: {
          [`${BASE_TOKEN_ADDRESS}:8453`]: buildUserAsset({
            address: BASE_TOKEN_ADDRESS,
            chainId: 8453,
            name: 'Token A',
            network: 'Base',
            quantity: '0',
            symbol: 'TKNA',
            value: '0',
          }),
          [`${OPTIMISM_TOKEN_ADDRESS}:10`]: buildUserAsset({
            address: OPTIMISM_TOKEN_ADDRESS,
            chainId: 10,
            name: 'Token B',
            network: 'Optimism',
            quantity: '0',
            symbol: 'TKNB',
            value: '0',
          }),
        },
      },
    });

    await watchAssetUpdates({
      address: TEST_ADDRESS,
      currency: 'ETH',
      staleBalances: undefined,
      watchedTransactions: useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS] ?? [],
    });

    expect(useAssetUpdatesStore.getState().watchedTransactions[TEST_ADDRESS]).toEqual([
      expect.objectContaining({
        transaction: expect.objectContaining({
          hash: activeTransaction.hash,
        }),
      }),
    ]);
    expect(mockUserAssetsFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockPositionsFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockClaimablesFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(mockRewardsFetch).toHaveBeenCalledWith(undefined, { force: true });
    expect(invalidateAddressNftsQueries).toHaveBeenCalledWith(TEST_ADDRESS);
  });
});

function resetStores() {
  useAssetUpdatesStore.setState({ watchedTransactions: {} });
  staleBalancesStore.setState({ staleBalances: {} });
  userAssetsStoreManager.setState({
    address: TEST_ADDRESS,
    cachedStore: null,
    currency: 'ETH',
    hiddenAssetBalances: {},
  });
}

function seedUserAssets(assets: ParsedSearchAsset[]) {
  userAssetsStore.getState(TEST_ADDRESS);
  userAssetsStore.setState(
    state => ({
      ...state,
      address: TEST_ADDRESS,
      userAssets: new Map(assets.map(asset => [asset.uniqueId, asset])),
    }),
    false,
    TEST_ADDRESS
  );
}

function buildAssetUpdateTransaction({
  buyBalanceAmount,
  hash,
  sellBalanceAmount,
}: {
  buyBalanceAmount?: string;
  hash?: string;
  sellBalanceAmount?: string;
} = {}) {
  return {
    asset: null,
    chainId: 8453,
    changes: [
      {
        asset: {
          address: BASE_TOKEN_ADDRESS,
          balance:
            typeof sellBalanceAmount === 'string'
              ? {
                  amount: sellBalanceAmount,
                  display: sellBalanceAmount,
                }
              : undefined,
          chainId: 8453,
          decimals: 18,
          name: 'Token A',
          network: 'Base',
          symbol: 'TKNA',
          uniqueId: getUniqueId(BASE_TOKEN_ADDRESS, 8453),
        },
        direction: TransactionDirection.OUT,
      },
      {
        asset: {
          address: OPTIMISM_TOKEN_ADDRESS,
          balance:
            typeof buyBalanceAmount === 'string'
              ? {
                  amount: buyBalanceAmount,
                  display: buyBalanceAmount,
                }
              : undefined,
          chainId: 10,
          decimals: 18,
          name: 'Token B',
          network: 'Optimism',
          symbol: 'TKNB',
          uniqueId: getUniqueId(OPTIMISM_TOKEN_ADDRESS, 10),
        },
        direction: TransactionDirection.IN,
      },
    ],
    hash: hash ?? '0x1111111111111111111111111111111111111111111111111111111111111111',
    minedAt: undefined,
    type: 'swap' as const,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });

  return { promise, resolve };
}

function buildParsedSearchAsset({
  address,
  balanceAmount,
  chainId,
  name,
  network,
  symbol,
}: {
  address: Address;
  balanceAmount: string;
  chainId: number;
  name: string;
  network: string;
  symbol: string;
}): ParsedSearchAsset {
  return {
    address,
    balance: {
      amount: balanceAmount,
      display: balanceAmount,
    },
    chainId,
    chainName: network,
    colors: {
      fallback: '#ffffff',
      primary: '#000000',
      shadow: '#111111',
    },
    decimals: 18,
    highLiquidity: true,
    isNativeAsset: false,
    isRainbowCurated: false,
    isVerified: true,
    mainnetAddress: address,
    name,
    native: {
      balance: {
        amount: balanceAmount,
        display: balanceAmount,
      },
      price: {
        amount: 1,
        change: '0',
        display: '$1',
      },
    },
    networks: {
      [chainId]: {
        address,
        decimals: 18,
      },
    },
    price: {
      changed_at: 0,
      relative_change_24h: 0,
      value: 1,
    },
    symbol,
    uniqueId: getUniqueId(address, chainId),
    updatedAt: '0',
  };
}

function buildUserAsset({
  address,
  chainId,
  name,
  network,
  quantity,
  symbol,
  value,
}: {
  address: Address;
  chainId: number;
  name: string;
  network: string;
  quantity: string;
  symbol: string;
  value: string;
}): UserAsset {
  return {
    asset: {
      address,
      bridging: {
        bridgeable: true,
        networks: {},
      },
      chainId,
      colors: {
        fallback: '#ffffff',
        primary: '#000000',
      },
      decimals: 18,
      name,
      network,
      networks: {
        [chainId]: {
          address,
          decimals: 18,
        },
      },
      price: {
        changedAt: 0,
        relativeChange24h: 0,
        value: 1,
      },
      symbol,
      transferable: true,
      type: 'erc20',
      verified: true,
    },
    quantity,
    updatedAt: '0',
    value,
  };
}
