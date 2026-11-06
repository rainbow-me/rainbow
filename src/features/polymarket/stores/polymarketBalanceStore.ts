import { createQueryStore, createStoreActions, getQueryKey, type FetchOptions, type SetDataParams } from '@storesjs/stores';
import { ethers } from 'ethers';
import { type Address } from 'viem';

import { USD_DECIMALS } from '@/features/currency/constants';
import {
  POLYGON_USDC_ADDRESS,
  POLYGON_USDC_DECIMALS,
  POLYMARKET_PUSD_ADDRESS,
  POLYMARKET_PUSD_DECIMALS,
} from '@/features/polymarket/constants';
import { buildPolymarketCacheUpdate } from '@/features/polymarket/stores/buildPolymarketCacheUpdate';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getLatestConfirmedPolygonBlockNumber } from '@/features/polymarket/utils/confirmation';
import { getErc20Balance, type EvmCallProvider } from '@/features/token/data/api/erc20Read';
import { truncateToDecimals } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { getProvider } from '@/handlers/web3';
import { abs, add, greaterThan, greaterThanOrEqualTo, isEqual, subtract } from '@/helpers/utilities';
import { RainbowError } from '@/logger';
import { createOptimisticUpdater, type OptimisticUpdate } from '@/state/internal/utils/createOptimisticUpdater';
import { ChainId } from '@rainbow-me/swaps';

// ============ Core Types ===================================================== //

type PolymarketBalances = { pusdBalance: string; usdcBalance: string };

type PolymarketBalanceParams = { address: Address | null };

type ExpectedBalanceDelta = { deltaUsd: string; pending: boolean; operationId: number };

type OptimisticBalanceUpdate = OptimisticUpdate<PolymarketBalances, typeof BALANCE_UPDATE_ID> & {
  baselineBalance: PolymarketBalances;
  deltas: readonly ExpectedBalanceDelta[];
  expectedBalance: PolymarketBalances;
};

export type PolymarketBalanceUpdate = {
  apply: (deltaUsd: string) => void;
  finalize: (adjustmentUsd?: string) => void;
  discard: () => void;
};

type PolymarketBalanceStoreActions = {
  beginUpdate: (proxyAddress: Address) => PolymarketBalanceUpdate;
  refresh: (proxyAddress?: Address) => Promise<void>;
  getBalance(proxyWallet?: Address, useFallback?: true): string;
  getBalance(proxyWallet: Address | undefined, useFallback: boolean): string | null;
  isBalanceZero: () => boolean;
};

// ============ Constants ====================================================== //

const BALANCE_UPDATE_ID = 'balance';
const STALE_TIME = time.seconds(10);
const OPTIMISTIC_BALANCE_CONFLICT_WINDOW = time.minutes(2);

const EMPTY_BALANCES: PolymarketBalances = { pusdBalance: '0', usdcBalance: '0' };
const FORCE_AND_THROW_FETCH_OPTIONS = { force: true, throwOnError: true } satisfies FetchOptions;

// ============ Balance Store ================================================== //

export const usePolymarketBalanceStore = createPolymarketBalanceStore();

export const polymarketBalanceActions = createStoreActions(usePolymarketBalanceStore);

function createPolymarketBalanceStore() {
  let nextOperationId = 0;
  const settledAtReadStart = new WeakMap<PolymarketBalances, OptimisticBalanceUpdate>();

  const optimisticBalance = createOptimisticUpdater<Address, typeof BALANCE_UPDATE_ID, PolymarketBalances, OptimisticBalanceUpdate>(
    OPTIMISTIC_BALANCE_CONFLICT_WINDOW
  );

  const store = createQueryStore<PolymarketBalances, PolymarketBalanceParams, PolymarketBalanceStoreActions>(
    {
      fetcher: fetchPolymarketBalance,
      enabled: $ => $(usePolymarketClients, s => Boolean(s.proxyAddress)),
      params: { address: $ => $(usePolymarketClients).proxyAddress },
      setData: setPolymarketBalanceData,
      staleTime: STALE_TIME,
    },

    (_, get) => {
      function getBalance(proxyWallet?: Address, useFallback?: true): string;
      function getBalance(proxyWallet: Address | undefined, useFallback: boolean): string | null;
      function getBalance(proxyWallet?: Address, useFallback = true): string | null {
        const balance = get().getData(proxyWallet ? { address: proxyWallet } : undefined);
        if (!balance && !useFallback) return null;

        return getDisplayBalance(balance ?? EMPTY_BALANCES);
      }

      return {
        beginUpdate: beginBalanceUpdate,
        refresh: refreshBalance,
        getBalance,

        isBalanceZero: () => Number(get().getBalance()) === 0,
      };
    },

    { storageKey: 'polymarketBalanceStore' }
  );

  // ========== Pending Balance Changes ==========

  /** Registers a submission without changing its displayed balance until acceptance. */
  function beginBalanceUpdate(proxyAddress: Address): PolymarketBalanceUpdate {
    const operationId = nextOperationId;
    nextOperationId += 1;

    const queryKey = getQueryKey({ address: proxyAddress });
    const currentBalance = store.getState().getCacheEntry(queryKey)?.data;

    if (currentBalance) {
      const previousUpdate = optimisticBalance.getUpdate(proxyAddress, BALANCE_UPDATE_ID);
      const deltas = previousUpdate?.deltas.slice() ?? [];
      deltas.push({ deltaUsd: '0', pending: true, operationId });

      optimisticBalance.track(
        proxyAddress,
        buildExpectedBalanceUpdate({
          baselineBalance: previousUpdate?.baselineBalance ?? currentBalance,
          deltas,
        })
      );
    }

    function changeDelta(transform: ((delta: ExpectedBalanceDelta) => ExpectedBalanceDelta) | null): void {
      store.setState(state => {
        const currentBalance = state.getCacheEntry(queryKey)?.data;
        const previousUpdate = optimisticBalance.getUpdate(proxyAddress, BALANCE_UPDATE_ID);
        const currentDelta = previousUpdate?.deltas.find(delta => delta.operationId === operationId);

        if (!currentBalance || !previousUpdate || !currentDelta) return state;

        const nextDelta = transform ? transform(currentDelta) : null;
        if (nextDelta === currentDelta) return state;

        const deltas = nextDelta
          ? previousUpdate.deltas.map(delta => (delta.operationId === operationId ? nextDelta : delta))
          : previousUpdate.deltas.filter(delta => delta.operationId !== operationId);

        const update = deltas.length ? buildExpectedBalanceUpdate({ baselineBalance: previousUpdate.baselineBalance, deltas }) : null;
        const expectedBalance = update?.expectedBalance ?? previousUpdate.baselineBalance;

        if (update) optimisticBalance.track(proxyAddress, update);
        else optimisticBalance.clear(proxyAddress);

        if (isSameBalance(currentBalance, expectedBalance)) return state;

        return buildPolymarketCacheUpdate(state.queryCache, queryKey, expectedBalance, STALE_TIME);
      });
    }

    return {
      apply: deltaUsd => changeDelta(delta => (delta.pending ? { ...delta, deltaUsd } : delta)),
      finalize: (adjustmentUsd = '0') =>
        changeDelta(delta => {
          if (!delta.pending) return delta;

          return { ...delta, deltaUsd: add(delta.deltaUsd, adjustmentUsd), pending: false };
        }),
      discard: () => changeDelta(null),
    };
  }

  // ========== Balance Fetching ==========

  /** Refreshes the captured wallet, retaining settled estimates until a subsequent read publishes. */
  async function refreshBalance(proxyAddress = usePolymarketClients.getState().proxyAddress ?? undefined): Promise<void> {
    const params = proxyAddress ? { address: proxyAddress } : undefined;
    const update = proxyAddress ? optimisticBalance.getUpdate(proxyAddress, BALANCE_UPDATE_ID) : undefined;

    if (!proxyAddress || !update || update.deltas.some(delta => delta.pending)) {
      await store.getState().fetch(params, { force: true });
      return;
    }

    let balance = await store.getState().fetch(params, FORCE_AND_THROW_FETCH_OPTIONS);

    if (optimisticBalance.getUpdate(proxyAddress, BALANCE_UPDATE_ID) === update) {
      balance = await store.getState().fetch(params, FORCE_AND_THROW_FETCH_OPTIONS);
    }

    if (balance === null) await store.getState().fetch(params, { force: true });
  }

  async function fetchPolymarketBalance({ address }: PolymarketBalanceParams): Promise<PolymarketBalances> {
    if (!address) throw new RainbowError('[PolymarketBalanceStore] Address is required');

    const update = optimisticBalance.getUpdate(address, BALANCE_UPDATE_ID);
    const canSettle = update && !update.deltas.some(delta => delta.pending);
    const provider = getProvider({ chainId: ChainId.polygon });

    const blockNumber = Math.max(await provider.getBlockNumber(), getLatestConfirmedPolygonBlockNumber());
    const blockProvider: EvmCallProvider = { call: transaction => provider.call(transaction, blockNumber) };
    const [rawUsdcBalance, rawPusdBalance] = await Promise.all([
      getErc20Balance({ owner: address, provider: blockProvider, tokenAddress: POLYGON_USDC_ADDRESS }),
      getErc20Balance({ owner: address, provider: blockProvider, tokenAddress: POLYMARKET_PUSD_ADDRESS }),
    ]);

    const usdcBalance = ethers.utils.formatUnits(rawUsdcBalance, POLYGON_USDC_DECIMALS);
    const pusdBalance = ethers.utils.formatUnits(rawPusdBalance, POLYMARKET_PUSD_DECIMALS);

    const balance = normalizeBalance({ pusdBalance, usdcBalance });
    if (canSettle) settledAtReadStart.set(balance, update);

    return balance;
  }

  // ========== Cache Reconciliation ==========

  function setPolymarketBalanceData({
    data,
    params,
    queryKey,
    set,
  }: SetDataParams<PolymarketBalances, PolymarketBalanceParams, PolymarketBalanceStoreActions>) {
    set(state => {
      const proxyAddress = params.address;
      const settled = settledAtReadStart.get(data);
      if (settled && proxyAddress && optimisticBalance.getUpdate(proxyAddress, BALANCE_UPDATE_ID) === settled) {
        optimisticBalance.clear(proxyAddress);
      }
      settledAtReadStart.delete(data);

      const balance = proxyAddress ? optimisticBalance.mergeBackendData(proxyAddress, data) : data;

      return buildPolymarketCacheUpdate(state.queryCache, queryKey, balance);
    });
  }

  return store;
}

// ============ Optimistic Balance Updates ===================================== //

function buildExpectedBalanceUpdate({
  baselineBalance,
  deltas,
}: {
  baselineBalance: PolymarketBalances;
  deltas: readonly ExpectedBalanceDelta[];
}): OptimisticBalanceUpdate {
  const expectedBalance = deltas.reduce((balance, delta) => applyBalanceDelta(balance, delta.deltaUsd), baselineBalance);

  return {
    apply: () => expectedBalance,
    baselineBalance,
    deltas,
    expectedBalance,
    id: BALANCE_UPDATE_ID,
  };
}

/**
 * Applies a signed USD change to the expected collateral balance.
 * Credits increase pUSD. Debits include USDC.e as wrapped pUSD, matching buy submission.
 */
function applyBalanceDelta(balance: PolymarketBalances, deltaUsd: string): PolymarketBalances {
  if (greaterThanOrEqualTo(deltaUsd, '0')) {
    return normalizeBalance({
      pusdBalance: add(balance.pusdBalance, deltaUsd),
      usdcBalance: balance.usdcBalance,
    });
  }

  return normalizeBalance({
    pusdBalance: subtract(getTotalBalance(balance), abs(deltaUsd)),
    usdcBalance: '0',
  });
}

// ============ Balance Utilities ============================================== //

function normalizeBalance({ pusdBalance, usdcBalance }: PolymarketBalances): PolymarketBalances {
  return {
    pusdBalance: truncateToDecimals(clampZero(pusdBalance), POLYMARKET_PUSD_DECIMALS),
    usdcBalance: truncateToDecimals(clampZero(usdcBalance), POLYGON_USDC_DECIMALS),
  };
}

function isSameBalance(balance: PolymarketBalances, otherBalance: PolymarketBalances): boolean {
  return isEqual(balance.pusdBalance, otherBalance.pusdBalance) && isEqual(balance.usdcBalance, otherBalance.usdcBalance);
}

function getDisplayBalance(balance: PolymarketBalances): string {
  return truncateToDecimals(getTotalBalance(balance), USD_DECIMALS);
}

function getTotalBalance(balance: PolymarketBalances): string {
  return add(balance.pusdBalance, balance.usdcBalance);
}

function clampZero(value: string): string {
  return greaterThan(value, '0') ? value : '0';
}
