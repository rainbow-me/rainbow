import { createBaseStore, getQueryKey } from '@storesjs/stores';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getUniqueId } from '@/entities/assetId';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { createMockPool, createMockPositionsData, createMockRainbowPosition } from '@/features/positions/__fixtures__/mocks/positions';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { rainbowStorage } from '@/state/internal/rainbowStorage';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { createUserAssetsStore } from './createUserAssetsStore';
import { deserializeUserAssetsState, serializeUserAssetsState } from './persistence';
import { type UserAsset } from './types';
import { userAssetsActions, useUserAssetSearchResults, useUserAssetsStore } from './userAssets';
import { userAssetsStoreManager } from './userAssetsStoreManager';
import { setUserAssets } from './utils';

const requests = vi.hoisted(() => ({
  assets: vi.fn<(path: string) => Promise<{ data: { result: Record<string, UserAsset> } }>>(async () => ({ data: { result: {} } })),
}));

vi.mock('@/resources/platform/client', () => ({ getPlatformClient: () => ({ get: requests.assets }) }));
vi.mock('@/state/wallets/walletsStore', () => ({ useWalletsStore: createBaseStore(() => ({ accountAddress: '' })) }));
vi.mock('@/resources/addys/client', () => ({ isStaging: () => false }));
vi.mock('@/analytics', () => ({ analytics: { track: vi.fn() } }));
vi.mock('@/features/config/stores/experimentalConfigStore', () => ({ getExperimentalFlag: () => false }));
vi.mock('@/features/config/hooks/experimentalHooks', () => ({}));

const ACCOUNT_A = '0x0000000000000000000000000000000000000001';
const ACCOUNT_B = '0x0000000000000000000000000000000000000002';
const LP = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const TOKEN = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const SMALL = '0xcccccccccccccccccccccccccccccccccccccccc';
const LP_ID = getUniqueId(LP, ChainId.mainnet);
const TOKEN_ID = getUniqueId(TOKEN, ChainId.optimism);
const SMALL_ID = getUniqueId(SMALL, ChainId.mainnet);

beforeEach(() => {
  vi.useFakeTimers();
  requests.assets.mockClear();
  userAssetsStoreManager.setState({ currency: 'USD', hiddenAssetBalances: {} });
  usePositionsStore.setState({ enabled: false, queryCache: {}, queryKey: '' });
  useWalletsStore.setState({ accountAddress: ACCOUNT_A });
  useUserAssetsStore.setState({
    enabled: false,
    hiddenAssets: new Set(),
    userAssets: new Map(),
    listAssets: new Map(),
    chainBalances: new Map(),
    hiddenAssetsBalance: null,
    filter: 'all',
    inputSearchQuery: '',
    queryCache: {},
    queryKey: '',
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('user assets', () => {
  it('uses canonical parsed holdings to exclude and restore a position token after a custom publication', async () => {
    requests.assets.mockResolvedValueOnce({ data: { result: { lp: asset(LP, '100'), token: asset(TOKEN, '20', ChainId.optimism) } } });
    const unsubscribe = useUserAssetsStore.subscribe(() => undefined);
    await userAssetsActions.fetch(undefined, { force: true });
    const source = useUserAssetsStore.getState().userAssets;
    const lp = source.get(LP_ID);
    expect(useUserAssetsStore.getState().getData()).toBeNull();
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(120);
    expect(useUserAssetsStore.getState().listAssets).toBe(source);

    publishPositions(ACCOUNT_A, [LP]);
    expect(Array.from(useUserAssetsStore.getState().listAssets.keys())).toEqual([TOKEN_ID]);
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(20);
    expect(useUserAssetsStore.getState().getHighestValueAsset()?.uniqueId).toBe(TOKEN_ID);
    expect(useUserAssetsStore.getState().userAssets).toBe(source);
    expect(useUserAssetsStore.getState().getUserAsset(LP_ID)).toBe(lp);
    const unchanged = useUserAssetsStore.getState();
    const reprocess = vi.spyOn(unchanged, 'reprocessAssetsData');
    publishPositions(ACCOUNT_A, [LP]);
    expect(useUserAssetsStore.getState()).toBe(unchanged);
    expect(reprocess).not.toHaveBeenCalled();
    reprocess.mockRestore();

    publishPositions(ACCOUNT_A, []);
    expect(useUserAssetsStore.getState().listAssets.values().next().value).toBe(lp);
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(120);
    expect(requests.assets.mock.calls.filter(([path]) => path === '/assets/GetAssetUpdates')).toHaveLength(1);
    unsubscribe();
  });

  it('keeps partial-chain updates in the canonical map while the position token is excluded', () => {
    publishPositions(ACCOUNT_A, [LP]);
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    const untouched = useUserAssetsStore.getState().userAssets.get(TOKEN_ID);
    publishAssets([asset(LP, '150')], [ChainId.mainnet]);
    expect(Array.from(useUserAssetsStore.getState().listAssets.keys())).toEqual([TOKEN_ID]);
    expect(useUserAssetsStore.getState().userAssets.get(TOKEN_ID)).toBe(untouched);

    publishPositions(ACCOUNT_A, []);
    expect(useUserAssetsStore.getState().listAssets.values().next().value?.native.balance.amount).toBe('150');
    publishAssets([], [ChainId.mainnet]);
    publishPositions(ACCOUNT_A, [LP]);
    publishPositions(ACCOUNT_A, []);
    expect(useUserAssetsStore.getState().userAssets.has(LP_ID)).toBe(false);
    expect(useUserAssetsStore.getState().listAssets.get(TOKEN_ID)).toBe(untouched);
  });

  it('subtracts hidden assets once, using their admitted balance rather than uncapped price times quantity', () => {
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    userAssetsActions.setHiddenAssets([LP_ID]);
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(20);
    expect(userAssetsStoreManager.getState().hiddenAssetBalances[ACCOUNT_A]).toBe('100');

    publishPositions(ACCOUNT_A, [LP]);
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(20);
    expect(userAssetsStoreManager.getState().hiddenAssetBalances[ACCOUNT_A]).toBe('0');
    publishPositions(ACCOUNT_A, []);
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(20);
    expect(
      useUserAssetsStore
        .getState()
        .getUserAssets()
        .map(value => value.uniqueId)
    ).toEqual([TOKEN_ID]);
  });

  it('derives search from current inputs without store writes and preserves results on unrelated status updates', () => {
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism), asset(SMALL, '0.001')]);
    const stop = useUserAssetSearchResults.subscribe(() => undefined);
    expect(useUserAssetSearchResults.getState()).toEqual([LP_ID, TOKEN_ID]);
    const source = useUserAssetsStore.getState();
    const result = useUserAssetSearchResults.getState();
    useUserAssetSearchResults.getState();
    expect(useUserAssetsStore.getState()).toBe(source);
    useUserAssetsStore.setState({ status: 'loading' });
    expect(useUserAssetSearchResults.getState()).toBe(result);

    userAssetsActions.setHiddenAssets([LP_ID]);
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID]);
    userAssetsActions.setSearchQuery('  token  ');
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID, SMALL_ID]);
    useUserAssetsStore.setState({ filter: ChainId.mainnet });
    expect(useUserAssetSearchResults.getState()).toEqual([SMALL_ID]);
    userAssetsActions.setSearchQuery(SMALL.toUpperCase());
    expect(useUserAssetSearchResults.getState()).toEqual([SMALL_ID]);
    publishPositions(ACCOUNT_A, [SMALL]);
    expect(useUserAssetSearchResults.getState()).toEqual([]);
    stop();
  });

  it('keeps explicit-address construction and A → B → A routing independent of the positions subscription', () => {
    const stop = useUserAssetsStore.subscribe(() => undefined);
    publishAssets([asset(LP, '100')]);
    publishPositions(ACCOUNT_B, [LP]);
    const active = useUserAssetsStore.getState();
    const other = createUserAssetsStore(ACCOUNT_B);
    other.setState(state =>
      setUserAssets({
        address: ACCOUNT_B,
        state,
        userAssets: [asset(LP, '200')],
        positionTokenAddresses: usePositionsStore.getState().getTokenAddresses(ACCOUNT_B),
      })
    );
    expect(other.getState().listAssets.size).toBe(0);
    expect(useUserAssetsStore.getState()).toBe(active);

    publishPositions(ACCOUNT_A, [LP]);
    expect(useUserAssetsStore.getState().listAssets.size).toBe(0);
    useWalletsStore.setState({ accountAddress: ACCOUNT_B });
    publishAssets([asset(LP, '200')]);
    publishPositions(ACCOUNT_B, []);
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(200);
    useWalletsStore.setState({ accountAddress: ACCOUNT_A });
    publishAssets([asset(LP, '100')]);
    expect(useUserAssetsStore.getState().listAssets.size).toBe(0);
    publishPositions(ACCOUNT_A, []);
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(100);
    stop();
  });

  it('applies equal position memberships to the newly selected account', () => {
    const stop = useUserAssetsStore.subscribe(() => undefined);
    publishAssets([asset(LP, '100')]);
    publishPositions(ACCOUNT_A, [LP]);
    expect(useUserAssetsStore.getState().listAssets.size).toBe(0);

    useWalletsStore.setState({ accountAddress: ACCOUNT_B });
    publishAssets([asset(LP, '200')]);
    publishPositions(ACCOUNT_B, [LP]);
    expect(useUserAssetsStore.getState().listAssets.size).toBe(0);
    expect(useUserAssetsStore.getState().userAssets.get(LP_ID)?.native.balance.amount).toBe('200');
    stop();
  });

  it('keeps retained same-account positions excluded while the new currency is loading', () => {
    publishPositions(ACCOUNT_A, [LP]);
    publishAssets([asset(LP, '100')]);
    expect(useUserAssetsStore.getState().listAssets.size).toBe(0);

    userAssetsStoreManager.setState({ currency: 'EUR' });
    publishAssets([asset(LP, '90')]);
    expect(usePositionsStore.getState().getData()?.positions.pool.pools[0].poolAddress).toBe(LP);
    expect(useUserAssetsStore.getState().listAssets.size).toBe(0);

    publishPositions(ACCOUNT_A, []);
    expect(useUserAssetsStore.getState().getTotalBalance()).toBe(90);
  });

  it('reuses cached search arrays when deleting characters and invalidates them when holdings change', () => {
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    const stop = useUserAssetSearchResults.subscribe(() => undefined);
    const emptyQuery = useUserAssetSearchResults.getState();
    userAssetsActions.setSearchQuery('to');
    const shorter = useUserAssetSearchResults.getState();
    userAssetsActions.setSearchQuery('toke');
    const longer = useUserAssetSearchResults.getState();
    userAssetsActions.setSearchQuery('to');
    expect(useUserAssetSearchResults.getState()).toBe(shorter);
    userAssetsActions.setSearchQuery('toke');
    expect(useUserAssetSearchResults.getState()).toBe(longer);

    for (let index = 0; index < 70; index++) {
      userAssetsActions.setSearchQuery(`unused${index}`);
      useUserAssetSearchResults.getState();
    }
    userAssetsActions.setSearchQuery('');
    expect(useUserAssetSearchResults.getState()).toBe(emptyQuery);
    userAssetsActions.setSearchQuery('to');
    expect(useUserAssetSearchResults.getState()).toEqual(shorter);
    expect(useUserAssetSearchResults.getState()).not.toBe(shorter);

    publishAssets([asset(TOKEN, '20', ChainId.optimism)]);
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID]);
    expect(useUserAssetSearchResults.getState()).not.toBe(longer);
    userAssetsActions.setHiddenAssets([TOKEN_ID]);
    expect(useUserAssetSearchResults.getState()).toEqual([]);
    stop();
  });

  it('hydrates version-two canonical data and metadata, discarding obsolete persisted indexes', () => {
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    userAssetsActions.setHiddenAssets([TOKEN_ID]);
    const state = useUserAssetsStore.getState();
    const serialized = serializeUserAssetsState({
      state: { userAssets: state.userAssets, hiddenAssets: state.hiddenAssets, filter: ChainId.optimism },
      version: 2,
    });
    expect(serialized).not.toContain('listAssets');
    expect(serialized).not.toContain('chainBalances');
    publishPositions(ACCOUNT_A, [LP]);
    const hydrated = deserializeUserAssetsState(serialized, ACCOUNT_A);
    expect(hydrated.version).toBe(2);
    expect(hydrated.state.userAssets?.size).toBe(2);
    expect(hydrated.state.filter).toBe(ChainId.optimism);
    expect(Array.from(hydrated.state.listAssets?.keys() ?? [])).toEqual([TOKEN_ID]);
    expect(hydrated.state.hiddenAssetsBalance).toBe('20');

    const previousFormat = JSON.stringify({
      state: {
        userAssets: [...state.userAssets],
        hiddenAssets: [TOKEN_ID],
        filter: 'all',
        legacyUserAssets: ['obsolete'],
        idsByChain: [['all', ['wrong']]],
        chainBalances: [[1, 999]],
        hiddenAssetsBalance: '999',
        queryKey: 'existing-key',
        queryCache: {},
        lastFetchedAt: 123,
        status: 'success',
        error: null,
      },
      version: 2,
    });
    const restored = deserializeUserAssetsState(previousFormat, ACCOUNT_A);
    expect(restored.state).not.toHaveProperty('legacyUserAssets');
    expect(restored.state).not.toHaveProperty('idsByChain');
    expect(restored.state.queryKey).toBe('existing-key');
    expect(restored.state.lastFetchedAt).toBe(123);
    expect(restored.state.chainBalances?.get(ChainId.optimism)).toBe(20);

    publishPositions(ACCOUNT_B, [LP]);
    const key = `userAssets_${ACCOUNT_B}`;
    rainbowStorage.set(key, previousFormat);
    const accountStore = createUserAssetsStore(ACCOUNT_B);
    expect(accountStore.getState().userAssets.size).toBe(2);
    expect(Array.from(accountStore.getState().listAssets.keys())).toEqual([TOKEN_ID]);
    expect(accountStore.getState().getTotalBalance()).toBe(0);
    accountStore.setState({ filter: ChainId.mainnet });
    vi.advanceTimersByTime(5000);
    const persisted = rainbowStorage.get(key);
    expect(typeof persisted).toBe('string');
    expect(persisted).toContain('"userAssets"');
    expect(persisted).toContain('"queryKey"');
    expect(persisted).not.toContain('"listAssets"');
    expect(persisted).not.toContain('"chainBalances"');
    expect(persisted).not.toContain('"legacyUserAssets"');
    expect(persisted).not.toContain('"idsByChain"');
    accountStore.persist?.clearStorage();
  });
});

function publishAssets(assets: UserAsset[], chains?: ChainId[]): void {
  useUserAssetsStore.setState(state =>
    setUserAssets({
      address: state.address,
      state,
      userAssets: assets,
      positionTokenAddresses: usePositionsStore.getState().getTokenAddresses(state.address),
      chainIdsToUpdate: chains,
    })
  );
}

function publishPositions(address: string, poolAddresses: string[]): void {
  const data = createMockPositionsData({
    positions: {
      pool: createMockRainbowPosition('pool', {
        pools: poolAddresses.map(poolAddress => createMockPool('LP', '1', '100', { poolAddress })),
      }),
    },
  });
  const queryKey = getQueryKey({
    address,
    currency: userAssetsStoreManager.getState().currency,
    chainIds: useBackendNetworksStore.getState().getSupportedPositionsChainIds(),
  });
  usePositionsStore.setState(state => ({
    queryKey: address === useWalletsStore.getState().accountAddress ? queryKey : state.queryKey,
    queryCache: { ...state.queryCache, [queryKey]: { data, lastFetchedAt: Date.now(), cacheTime: 100000, errorInfo: null } },
  }));
}

function asset(address: string, value: string, chainId = ChainId.mainnet): UserAsset {
  return {
    asset: {
      address,
      chainId,
      name: 'Token',
      symbol: 'TKN',
      decimals: 18,
      type: 'erc20',
      network: 'ethereum',
      verified: true,
      transferable: true,
      colors: { primary: '#000000' },
      price: { value: 1000, changedAt: 0, relativeChange24h: 0 },
      networks: {},
      bridging: { bridgeable: false, networks: {} },
    },
    quantity: '1000000000000000000',
    updatedAt: '0',
    value,
  };
}
