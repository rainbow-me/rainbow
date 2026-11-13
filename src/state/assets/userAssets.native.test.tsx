import { createBaseStore, getQueryKey } from '@storesjs/stores';
import { type Address } from 'viem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type AddressOrEth, type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/entities/assetId';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { createMockPool, createMockPositionsData, createMockRainbowPosition } from '@/features/positions/__fixtures__/mocks/positions';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { appSettingsActions } from '@/features/settings/data/appSettingsStore';
import { useWalletAssetsStore } from '@/features/wallet/data/walletAssetsStore';
import { type TokenData } from '@/state/liveTokens/types';
import { useHiddenAssetBalancesStore } from '@/state/wallets/hiddenAssetBalancesStore';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { createDepositConfig } from '@/systems/funding/config';
import { resolveInitialDepositAsset } from '@/systems/funding/utils/sourceAsset';

import { type UserAsset } from './types';
import { userAssetsActions, useUserAssetsStore } from './userAssets';
import { userAssetsSearchActions, useUserAssetSearch, useUserAssetSearchResults } from './userAssetsSearch';

const getAssets = vi.hoisted(() =>
  vi.fn<(path: string) => Promise<{ data: { result?: Record<string, UserAsset> } }>>(async () => ({ data: { result: {} } }))
);

vi.mock('@/resources/platform/client', () => ({ getPlatformClient: () => ({ get: getAssets }) }));
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
  appSettingsActions.setCurrency('USD');
  useHiddenAssetBalancesStore.setState({ hiddenAssetBalances: {} });
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
  it('clears holdings when the API omits an empty result', async () => {
    userAssetsActions.updateAssets([asset(LP, '100')]);
    getAssets.mockResolvedValueOnce({ data: {} });
    await userAssetsActions.fetch(undefined, { force: true });

    expect(useUserAssetsStore.getState().userAssets.size).toBe(0);
  });

  it('converts platform defaults and timestamps before exposing holdings', async () => {
    const holding: UserAsset = {
      asset: {
        address: TOKEN,
        chainId: ChainId.optimism,
        mainnetAddress: LP,
        colors: {},
        price: { value: 10, changedAt: '2026-11-13T14:00:00Z' },
        networks: { [ChainId.optimism]: { address: TOKEN } },
        bridging: { networks: { [ChainId.mainnet]: {} } },
      },
      quantity: '2',
      value: '20',
    };
    getAssets.mockResolvedValueOnce({ data: { result: { token: holding } } });
    await userAssetsActions.fetch(undefined, { force: true });

    expect(userAssetsActions.getUserAsset(TOKEN_ID)).toMatchObject({
      mainnetAddress: LP,
      decimals: 0,
      isVerified: false,
      balance: { amount: '2' },
      networks: { [ChainId.optimism]: { address: TOKEN, decimals: 0 } },
      price: { value: 10, changed_at: 1794578400, relative_change_24h: 0 },
      bridging: { isBridgeable: false, networks: { [ChainId.mainnet]: {} } },
    });

    const token: TokenData = {
      price: '12',
      change: { change5mPct: '0', change1hPct: '0', change4hPct: '0', change12hPct: '0', change24hPct: '0' },
      marketData: { circulatingMarketCap: '0' },
      reliability: { metadata: { liquidityCap: '0' }, status: 'PRICE_RELIABILITY_STATUS_TRUSTED' },
      updateTime: '2026-11-13T13:59:59Z',
    };
    userAssetsActions.mutatePrices({ [TOKEN_ID]: token });
    expect(userAssetsActions.getUserAsset(TOKEN_ID)?.price?.value).toBe(10);

    userAssetsActions.mutatePrices({ [TOKEN_ID]: { ...token, updateTime: '2026-11-13T14:00:01Z' } });
    expect(userAssetsActions.getUserAsset(TOKEN_ID)?.price).toMatchObject({ value: 12, changed_at: 1794578401 });

    userAssetsActions.mutatePrices({ [TOKEN_ID]: { ...token, price: '11', updateTime: '2026-11-13T14:00:00Z' } });
    expect(userAssetsActions.getUserAsset(TOKEN_ID)?.price?.value).toBe(12);
  });

  it('excludes the opposite swap asset from highest-value selection', () => {
    const nativeAddress = useBackendNetworksStore.getState().getChainsNativeAsset()[ChainId.mainnet].address;
    const nativeId = getUniqueId(nativeAddress, ChainId.mainnet);
    userAssetsActions.updateAssets([asset(nativeAddress, '100'), asset(TOKEN, '20', ChainId.optimism)]);

    expect(userAssetsActions.getHighestValueAsset({ excludeAssetId: nativeId, nativeAsset: 'preferred' })?.uniqueId).toBe(TOKEN_ID);
    userAssetsActions.setHiddenAssets([TOKEN_ID]);
    expect(userAssetsActions.getHighestValueAsset({ excludeAssetId: nativeId, nativeAsset: 'preferred' })).toBeNull();
  });

  it('selects the initial deposit asset from eligible holdings, preferring a native asset', () => {
    const config = createDepositConfig({
      id: 'deposit',
      to: { chainId: ChainId.optimism, token: { address: TOKEN, decimals: 18, symbol: 'TKN' } },
    });
    const nativeAddress = useBackendNetworksStore.getState().getChainsNativeAsset()[ChainId.mainnet].address;
    const nativeId = getUniqueId(nativeAddress, ChainId.mainnet);
    userAssetsActions.updateAssets([asset(nativeAddress, '0.01'), asset(TOKEN, '100', ChainId.optimism)]);

    expect(useUserAssetSearch.getState().defaultAssetIds).toEqual([TOKEN_ID]);
    expect(resolveInitialDepositAsset(config)?.uniqueId).toBe(TOKEN_ID);

    userAssetsActions.updateAssets([asset(nativeAddress, '1'), asset(TOKEN, '100', ChainId.optimism)]);
    expect(resolveInitialDepositAsset(config)?.uniqueId).toBe(nativeId);

    userAssetsActions.updateAssets([asset(nativeAddress, '0.01')]);
    expect(resolveInitialDepositAsset(config)).toBeNull();
  });

  it('excludes position tokens from the matching chain’s wallet rows while keeping them spendable', () => {
    const optimismLpId = getUniqueId(LP, ChainId.optimism);
    userAssetsActions.updateAssets([asset(LP, '100'), asset(LP, '50', ChainId.optimism)]);
    setPosition(LP);

    expect(Array.from(useWalletAssetsStore.getState().assets.keys())).toEqual([optimismLpId]);
    expect(useWalletAssetsStore.getState().balance).toBe(50);
    expect(userAssetsActions.getHighestValueAsset()?.uniqueId).toBe(LP_ID);
    expect(useUserAssetSearchResults.getState()).toEqual([LP_ID, optimismLpId]);
  });

  it('replaces only the updated chain’s holdings, including when that chain becomes empty', () => {
    userAssetsActions.updateAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    userAssetsActions.updateAssets([asset(LP, '150')], [ChainId.mainnet]);

    expect(userAssetsActions.getUserAsset(LP_ID)?.native.balance.amount).toBe('150');
    expect(userAssetsActions.getUserAsset(TOKEN_ID)?.native.balance.amount).toBe('20');

    userAssetsActions.updateAssets([], [ChainId.mainnet]);

    expect(userAssetsActions.getUserAsset(LP_ID)).toBeNull();
    expect(userAssetsActions.getUserAsset(TOKEN_ID)?.native.balance.amount).toBe('20');
  });

  it('subtracts hidden holdings by their reported value, including position tokens', async () => {
    userAssetsActions.updateAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    userAssetsActions.setHiddenAssets([LP_ID]);
    expect(useWalletAssetsStore.getState().balance).toBe(20);
    expect(useHiddenAssetBalancesStore.getState().hiddenAssetBalances[ACCOUNT_A]).toBe('100');

    setPosition(LP);
    expect(useWalletAssetsStore.getState().balance).toBe(20);
    expect(useHiddenAssetBalancesStore.getState().hiddenAssetBalances[ACCOUNT_A]).toBe('100');

    getAssets.mockResolvedValueOnce({ data: { result: { lp: asset(LP, '50'), token: asset(TOKEN, '20', ChainId.optimism) } } });
    await userAssetsActions.fetch(undefined, { force: true });
    expect(useHiddenAssetBalancesStore.getState().hiddenAssetBalances[ACCOUNT_A]).toBe('50');
    expect(useWalletAssetsStore.getState().balance).toBe(20);
  });

  it('searches small balances while respecting hidden assets and the chain filter', () => {
    userAssetsActions.updateAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism), asset(SMALL, '0.001')]);
    expect(useUserAssetSearchResults.getState()).toEqual([LP_ID, TOKEN_ID]);

    userAssetsActions.setHiddenAssets([LP_ID]);
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID]);

    userAssetsSearchActions.setSearchQuery('  token  ');
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID, SMALL_ID]);

    userAssetsSearchActions.setChainFilter(ChainId.mainnet);
    expect(useUserAssetSearchResults.getState()).toEqual([SMALL_ID]);

    userAssetsSearchActions.setSearchQuery(SMALL.toUpperCase());
    expect(useUserAssetSearchResults.getState()).toEqual([SMALL_ID]);
  });

  it('updates an explicit account without changing the selected account’s holdings', () => {
    userAssetsActions.updateAssets([asset(LP, '100')]);
    const other = useUserAssetsStore.getState(ACCOUNT_B);
    other.updateAssets([asset(LP, '200')]);

    expect(other.getUserAsset(LP_ID)?.native.balance.amount).toBe('200');
    expect(userAssetsActions.getUserAsset(LP_ID)?.native.balance.amount).toBe('100');
  });

  it('does not filter the selected wallet using another account’s positions', () => {
    setPosition(LP);
    userAssetsActions.updateAssets([asset(LP, '100')]);
    expect(useWalletAssetsStore.getState().assets.size).toBe(0);

    useWalletsStore.setState({ accountAddress: ACCOUNT_B });
    userAssetsActions.updateAssets([asset(LP, '200')]);
    expect(useWalletAssetsStore.getState().balance).toBe(200);

    setPosition(LP);
    expect(useWalletAssetsStore.getState().assets.size).toBe(0);
  });

  it('reuses backspaced searches and invalidates them when holdings or hidden assets change', () => {
    userAssetsActions.updateAssets([asset(LP, '100'), asset(TOKEN, '20', ChainId.optimism)]);
    const stop = useUserAssetSearchResults.subscribe(() => undefined);
    userAssetsSearchActions.setSearchQuery('to');
    const shorter = useUserAssetSearchResults.getState();
    userAssetsSearchActions.setSearchQuery('toke');
    const longer = useUserAssetSearchResults.getState();
    userAssetsSearchActions.setSearchQuery('to');
    expect(useUserAssetSearchResults.getState()).toBe(shorter);
    userAssetsSearchActions.setSearchQuery('toke');
    expect(useUserAssetSearchResults.getState()).toBe(longer);

    userAssetsActions.updateAssets([asset(TOKEN, '20', ChainId.optimism)]);
    expect(useUserAssetSearchResults.getState()).toEqual([TOKEN_ID]);
    userAssetsActions.setHiddenAssets([TOKEN_ID]);
    expect(useUserAssetSearchResults.getState()).toEqual([]);
    stop();
  });
});

function setPosition(poolAddress: Address): void {
  const data = createMockPositionsData({
    positions: {
      pool: createMockRainbowPosition('pool', {
        pools: [createMockPool('LP', '1', '100', { poolAddress })],
      }),
    },
  });
  const queryKey = getQueryKey({
    address: useWalletsStore.getState().accountAddress,
    currency: appSettingsActions.getCurrency(),
    chainIds: useBackendNetworksStore.getState().getSupportedPositionsChainIds(),
  });
  usePositionsStore.setState(state => ({
    queryKey,
    queryCache: { ...state.queryCache, [queryKey]: { data, lastFetchedAt: Date.now(), cacheTime: Infinity, errorInfo: null } },
  }));
}

function asset(address: AddressOrEth, value: string, chainId = ChainId.mainnet): UserAsset {
  return {
    asset: {
      address,
      chainId,
      name: 'Token',
      symbol: 'TKN',
      decimals: 18,
      colors: {},
      price: { value: 1000 },
    },
    quantity: '1000000000000000000',
    value,
  };
}
