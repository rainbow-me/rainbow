import { createBaseStore, getQueryKey } from '@storesjs/stores';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/entities/assetId';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { createMockPool, createMockPositionsData, createMockRainbowPosition } from '@/features/positions/__fixtures__/mocks/positions';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useWalletAssetsStore } from '@/features/wallet/data/walletAssetsStore';
import { rainbowStorage } from '@/state/internal/rainbowStorage';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { createDepositConfig } from '@/systems/funding/config';
import { resolveInitialDepositAsset } from '@/systems/funding/utils/sourceAsset';

import { createUserAssetsStore } from './createUserAssetsStore';
import { type UserAsset } from './types';
import { userAssetsActions, useUserAssetsStore } from './userAssets';
import { userAssetsSearchActions, useUserAssetSearch, useUserAssetSearchResults } from './userAssetsSearch';
import { userAssetsStoreManager } from './userAssetsStoreManager';

const requests = vi.hoisted(() => ({
  assets: vi.fn<(path: string) => Promise<{ data: { result: Record<string, UserAsset> } }>>(async () => ({ data: { result: {} } })),
}));

vi.mock('@/resources/platform/client', () => ({ getPlatformClient: () => ({ get: requests.assets }) }));
vi.mock('@/__swaps__/utils/swaps', () => ({ parseAssetAndExtend: ({ asset }: { asset: ParsedSearchAsset | null }) => asset }));
vi.mock('@/systems/funding/constants', () => ({ INITIAL_SLIDER_PROGRESS: 25 }));
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
  userAssetsSearchActions.reset();
  usePositionsStore.setState({ enabled: false, queryCache: {}, queryKey: '' });
  useWalletsStore.setState({ accountAddress: ACCOUNT_A });
  useUserAssetsStore.setState({
    enabled: false,
    hiddenAssets: new Set(),
    userAssets: new Map(),
    chainBalances: new Map(),
    queryCache: {},
    queryKey: '',
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('user assets', () => {
  it('excludes the opposite swap asset from highest-value selection', () => {
    const nativeAddress = useBackendNetworksStore.getState().getChainsNativeAsset()[ChainId.mainnet].address;
    const nativeId = getUniqueId(nativeAddress, ChainId.mainnet);
    publishAssets([asset(nativeAddress, '100'), asset(TOKEN, '20', ChainId.optimism)]);

    expect(userAssetsActions.getHighestValueAsset({ excludeAssetId: nativeId, nativeAsset: 'preferred' })?.uniqueId).toBe(TOKEN_ID);
    userAssetsActions.setHiddenAssets([TOKEN_ID]);
    expect(userAssetsActions.getHighestValueAsset({ excludeAssetId: nativeId, nativeAsset: 'preferred' })).toBeNull();
  });

  it('selects an initial deposit asset from the default list independently of search controls', () => {
    const config = createDepositConfig({
      id: 'deposit',
      to: { chainId: ChainId.optimism, token: { address: TOKEN, decimals: 18, symbol: 'TKN' } },
    });
    const nativeAddress = useBackendNetworksStore.getState().getChainsNativeAsset()[ChainId.mainnet].address;
    const nativeId = getUniqueId(nativeAddress, ChainId.mainnet);
    publishAssets([asset(nativeAddress, '0.01'), asset(TOKEN, '100', ChainId.optimism)]);

    expect(useUserAssetSearch.getState().defaultAssetIds).toEqual([TOKEN_ID]);
    expect(resolveInitialDepositAsset(config)?.uniqueId).toBe(TOKEN_ID);

    userAssetsSearchActions.setSearchQuery('no matching token');
    userAssetsSearchActions.setChainIdFilter(ChainId.mainnet);
    expect(useUserAssetSearchResults.getState()).toEqual([]);
    expect(resolveInitialDepositAsset(config)?.uniqueId).toBe(TOKEN_ID);

    publishAssets([asset(nativeAddress, '1'), asset(TOKEN, '100', ChainId.optimism)]);
    expect(resolveInitialDepositAsset(config)?.uniqueId).toBe(nativeId);

    publishAssets([asset(nativeAddress, '0.01')]);
    expect(resolveInitialDepositAsset(config)).toBeNull();
  });

  it('keeps position tokens spendable while excluding them from wallet rows and balance', async () => {
    requests.assets.mockResolvedValueOnce({ data: { result: { lp: asset(LP, '100'), token: asset(TOKEN, '20', ChainId.optimism) } } });
    const unsubscribe = useUserAssetsStore.subscribe(() => undefined);
    await userAssetsActions.fetch(undefined, { force: true });
    const source = useUserAssetsStore.getState().userAssets;
    const lp = source.get(LP_ID);
    expect(useWalletAssetsStore.getState().balance).toBe(120);
    expect(useWalletAssetsStore.getState().assets).toBe(source);

    publishPositions(ACCOUNT_A, [LP]);
    expect(Array.from(useWalletAssetsStore.getState().assets.keys())).toEqual([TOKEN_ID]);
    expect(useWalletAssetsStore.getState().balance).toBe(20);
    expect(useUserAssetsStore.getState().getHighestValueAsset()?.uniqueId).toBe(LP_ID);
    expect(
      useUserAssetsStore
        .getState()
        .getUserAssets()
        .map(asset => asset.uniqueId)
    ).toEqual([LP_ID, TOKEN_ID]);
    expect(useUserAssetsStore.getState().userAssets).toBe(source);
    expect(useUserAssetsStore.getState().getUserAsset(LP_ID)).toBe(lp);

    publishPositions(ACCOUNT_A, []);
    expect(useWalletAssetsStore.getState().assets.values().next().value).toBe(lp);
    expect(useWalletAssetsStore.getState().balance).toBe(120);
    expect(requests.assets.mock.calls.filter(([path]) => path === '/assets/GetAssetUpdates')).toHaveLength(1);
    unsubscribe();
  });

  it('excludes a position token only on its own chain', () => {
    publishAssets([asset(LP, '100'), asset(LP, '50', ChainId.optimism)]);
    publishPositions(ACCOUNT_A, [LP]);

    expect(Array.from(useWalletAssetsStore.getState().assets.keys())).toEqual([getUniqueId(LP, ChainId.optimism)]);
    expect(useWalletAssetsStore.getState().balance).toBe(50);
    expect(useUserAssetsStore.getState().userAssets.size).toBe(2);
  });

  it('keeps partial-chain updates in the canonical map while the position token is excluded', () => {
    publishPositions(ACCOUNT_A, [LP]);
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    const untouched = useUserAssetsStore.getState().userAssets.get(TOKEN_ID);
    publishAssets([asset(LP, '150')], [ChainId.mainnet]);
    expect(Array.from(useWalletAssetsStore.getState().assets.keys())).toEqual([TOKEN_ID]);
    expect(useUserAssetsStore.getState().userAssets.get(TOKEN_ID)).toBe(untouched);

    publishPositions(ACCOUNT_A, []);
    expect(useWalletAssetsStore.getState().assets.values().next().value?.native.balance.amount).toBe('150');
    publishPositions(ACCOUNT_A, [LP]);
    publishAssets([], [ChainId.mainnet]);
    publishPositions(ACCOUNT_A, []);
    expect(useUserAssetsStore.getState().userAssets.has(LP_ID)).toBe(false);
    expect(useWalletAssetsStore.getState().assets.get(TOKEN_ID)).toBe(untouched);
  });

  it('subtracts hidden assets once, using their admitted balance rather than uncapped price times quantity', async () => {
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    userAssetsActions.setHiddenAssets([LP_ID]);
    expect(useWalletAssetsStore.getState().balance).toBe(20);
    expect(userAssetsStoreManager.getState().hiddenAssetBalances[ACCOUNT_A]).toBe('100');

    publishPositions(ACCOUNT_A, [LP]);
    expect(useWalletAssetsStore.getState().balance).toBe(20);
    expect(userAssetsStoreManager.getState().hiddenAssetBalances[ACCOUNT_A]).toBe('100');
    publishPositions(ACCOUNT_A, []);
    expect(useWalletAssetsStore.getState().balance).toBe(20);
    expect(
      useUserAssetsStore
        .getState()
        .getUserAssets()
        .map(value => value.uniqueId)
    ).toEqual([TOKEN_ID]);

    requests.assets.mockResolvedValueOnce({ data: { result: { lp: asset(LP, '50'), token: asset(TOKEN, '20', ChainId.optimism) } } });
    await userAssetsActions.fetch(undefined, { force: true });
    expect(userAssetsStoreManager.getState().hiddenAssetBalances[ACCOUNT_A]).toBe('50');
    expect(useWalletAssetsStore.getState().balance).toBe(20);
  });

  it('derives search from current inputs without store writes and preserves results on unrelated status updates', () => {
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism), asset(SMALL, '0.001')]);
    const stop = useUserAssetSearchResults.subscribe(() => undefined);
    const stopWalletAssets = useWalletAssetsStore.subscribe(() => undefined);
    const result = useUserAssetSearchResults.getState();
    expect(result).toEqual([LP_ID, TOKEN_ID]);
    useUserAssetsStore.setState({ status: 'loading' });
    expect(useUserAssetSearchResults.getState()).toBe(result);

    userAssetsActions.setHiddenAssets([LP_ID]);
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID]);
    const walletAssets = useWalletAssetsStore.getState();
    const onHoldingsChange = vi.fn();
    const stopHoldings = useUserAssetsStore.subscribe(onHoldingsChange);
    userAssetsSearchActions.setSearchQuery('  token  ');
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID, SMALL_ID]);
    expect(useWalletAssetsStore.getState()).toBe(walletAssets);

    userAssetsSearchActions.setChainIdFilter(ChainId.mainnet);
    expect(useUserAssetSearchResults.getState()).toEqual([SMALL_ID]);
    expect(onHoldingsChange).not.toHaveBeenCalled();
    stopHoldings();

    userAssetsSearchActions.setSearchQuery(SMALL.toUpperCase());
    expect(useUserAssetSearchResults.getState()).toEqual([SMALL_ID]);
    const results = useUserAssetSearchResults.getState();
    publishPositions(ACCOUNT_A, [SMALL]);
    expect(useUserAssetSearchResults.getState()).toBe(results);
    expect(useWalletAssetsStore.getState().assets.has(SMALL_ID)).toBe(false);

    userAssetsSearchActions.reset();
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID]);
    stopWalletAssets();
    stop();
  });

  it('updates an explicit account without changing the selected account’s holdings', () => {
    publishAssets([asset(LP, '100')]);
    const other = useUserAssetsStore.getState(ACCOUNT_B);
    other.updateAssets([asset(LP, '200')]);

    expect(other.getUserAsset(LP_ID)?.native.balance.amount).toBe('200');
    expect(useUserAssetsStore.getState().getUserAsset(LP_ID)?.native.balance.amount).toBe('100');
  });

  it('uses only the selected account and currency’s positions', () => {
    publishPositions(ACCOUNT_A, [LP]);
    publishAssets([asset(LP, '100')]);
    expect(useWalletAssetsStore.getState().assets.size).toBe(0);

    useWalletsStore.setState({ accountAddress: ACCOUNT_B });
    publishAssets([asset(LP, '200')]);
    expect(useWalletAssetsStore.getState().balance).toBe(200);

    publishPositions(ACCOUNT_B, [LP]);
    expect(useWalletAssetsStore.getState().assets.size).toBe(0);
    userAssetsStoreManager.setState({ currency: 'EUR' });
    publishAssets([asset(LP, '90')]);
    expect(useWalletAssetsStore.getState().balance).toBe(90);

    publishPositions(ACCOUNT_B, [LP]);
    expect(useWalletAssetsStore.getState().assets.size).toBe(0);
    expect(useWalletAssetsStore.getState().balance).toBe(0);
  });

  it('reuses cached search arrays when deleting characters and invalidates them when holdings change', () => {
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    const stop = useUserAssetSearchResults.subscribe(() => undefined);
    const emptyQuery = useUserAssetSearchResults.getState();
    userAssetsSearchActions.setSearchQuery('to');
    const shorter = useUserAssetSearchResults.getState();
    userAssetsSearchActions.setSearchQuery('toke');
    const longer = useUserAssetSearchResults.getState();
    userAssetsSearchActions.setSearchQuery('to');
    expect(useUserAssetSearchResults.getState()).toBe(shorter);
    userAssetsSearchActions.setSearchQuery('toke');
    expect(useUserAssetSearchResults.getState()).toBe(longer);

    for (let index = 0; index < 70; index++) {
      userAssetsSearchActions.setSearchQuery(`unused${index}`);
      useUserAssetSearchResults.getState();
    }
    userAssetsSearchActions.setSearchQuery('');
    expect(useUserAssetSearchResults.getState()).toBe(emptyQuery);
    userAssetsSearchActions.setSearchQuery('to');
    expect(useUserAssetSearchResults.getState()).toEqual(shorter);
    expect(useUserAssetSearchResults.getState()).not.toBe(shorter);

    publishAssets([asset(TOKEN, '20', ChainId.optimism)]);
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID]);
    userAssetsActions.setHiddenAssets([TOKEN_ID]);
    expect(useUserAssetSearchResults.getState()).toEqual([]);
    stop();
  });

  it('restores version-two holdings and preferences and rebuilds balances', () => {
    publishAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    const previousFormat = JSON.stringify({
      state: {
        userAssets: [...useUserAssetsStore.getState().userAssets],
        hiddenAssets: [TOKEN_ID],
        chainBalances: [[1, 999]],
        queryKey: 'existing-key',
        queryCache: {},
        lastFetchedAt: 123,
        status: 'success',
        error: null,
      },
      version: 2,
    });
    const key = `userAssets_${ACCOUNT_B}`;
    rainbowStorage.set(key, previousFormat);
    const accountStore = createUserAssetsStore(ACCOUNT_B);
    const restored = accountStore.getState();
    expect(Array.from(restored.userAssets.keys())).toEqual([LP_ID, TOKEN_ID]);
    expect(restored.getUserAssets().map(asset => asset.uniqueId)).toEqual([LP_ID]);
    expect(restored.lastFetchedAt).toBe(123);
    expect(restored.status).toBe('success');
    expect(restored.chainBalances.get(ChainId.mainnet)).toBe(100);
    expect(restored.chainBalances.get(ChainId.optimism)).toBe(20);
    expect(userAssetsStoreManager.getState().hiddenAssetBalances[ACCOUNT_B]).toBe('20');
    accountStore.persist?.clearStorage();
  });
});

function publishAssets(assets: UserAsset[], chains?: ChainId[]): void {
  userAssetsActions.updateAssets(assets, chains);
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
