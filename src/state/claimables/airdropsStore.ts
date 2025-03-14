import { qs } from 'url-parse';
import { Address } from 'viem';
import { NativeCurrencyKey } from '@/entities';
import { getSizedImageUrl } from '@/handlers/imgix';
import { logger, RainbowError } from '@/logger';
import Routes from '@/navigation/routesNames';
import { AddysClaimable, RainbowClaimable } from '@/resources/addys/claimables/types';
import { parseClaimables } from '@/resources/addys/claimables/utils';
import { getAddysHttpClient } from '@/resources/addys/client';
import { AddysConsolidatedError } from '@/resources/addys/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { CacheEntry, createQueryStore } from '@/state/internal/createQueryStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { time } from '@/utils/time';

type PaginationInfo = {
  current_page: number;
  next: number | null;
  page_size: number;
  total_elements: number;
  total_pages: number;
};

type AirdropsResponse = {
  pagination: PaginationInfo;
  payload: {
    claimables: AddysClaimable[];
  };
  metadata: {
    errors?: AddysConsolidatedError[];
    status: string;
  };
};

type AirdropsParams = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
  page: number;
  pageSize: number;
};

type AirdropsQueryData = {
  claimables: RainbowClaimable[];
  pagination: PaginationInfo | null;
};

type UniqueId = string;
type Timestamp = number;

type AirdropsState = {
  airdrops: {
    address: Address | string;
    claimables: RainbowClaimable[];
    currency: NativeCurrencyKey;
    fetchedAt: { [pageNumber: number]: number };
    pagination: PaginationInfo | null;
  } | null;
  recentlyClaimed: Map<UniqueId, Timestamp> | null;
  fetchNextPage: () => Promise<void>;
  getAirdrops: () => RainbowClaimable[] | null;
  getCurrentPage: () => number | null;
  getFirstCoinIconUrl: (size?: number) => string | null;
  getNextPage: () => number | null;
  getNumberOfAirdrops: () => number | null;
  getPaginationInfo: () => PaginationInfo | null;
  hasNextPage: () => boolean;
  markClaimed: (uniqueId: string) => void;
};

export const INITIAL_PAGE_SIZE = 12;
export const FULL_PAGE_SIZE = 100;

const EMPTY_RETURN_DATA: AirdropsQueryData = { claimables: [], pagination: null };
const OPTIMISTIC_UPDATE_EVICTION_TIME = time.minutes(3);
const STALE_TIME = time.minutes(2);

let paginationPromise: { address: Address | string; currency: NativeCurrencyKey; promise: Promise<void> } | null = null;

export const useAirdropsStore = createQueryStore<AirdropsQueryData, AirdropsParams, AirdropsState>(
  {
    fetcher: fetchAirdrops,
    onFetched: ({ data, params, set }) => pruneAirdropsData(data, params, set),
    cacheTime: time.days(1),
    params: {
      address: $ => $(userAssetsStoreManager).address,
      currency: $ => $(userAssetsStoreManager).currency,
      page: 1,
      pageSize: INITIAL_PAGE_SIZE,
    },
    staleTime: STALE_TIME,
  },

  (set, get) => ({
    airdrops: null,
    recentlyClaimed: null,

    async fetchNextPage() {
      const { address, currency } = userAssetsStoreManager.getState();
      if (paginationPromise && paginationPromise.address === address && paginationPromise.currency === currency) {
        return paginationPromise.promise;
      }
      const { airdrops: storedAirdrops, fetch, getPaginationInfo } = get();
      const airdrops = storedAirdrops?.address === address && storedAirdrops?.currency === currency ? storedAirdrops : null;
      const paginationInfo = getPaginationInfo();
      const nextPage = (airdrops ? paginationInfo?.next : paginationInfo?.total_pages === 1 ? null : 1) ?? null;
      const hasNextPage = nextPage !== null;

      if (hasNextPage) {
        if (!address) return;
        const now = Date.now();
        const isStale =
          airdrops && nextPage > 1 ? Object.values(airdrops.fetchedAt).some(fetchedAt => now - fetchedAt > STALE_TIME) : false;

        if (!isStale) {
          paginationPromise = {
            address,
            currency,
            promise: fetch({ page: nextPage, pageSize: FULL_PAGE_SIZE }, { force: true, skipStoreUpdates: true })
              .then(data => {
                if (!data) return;
                set({
                  airdrops: {
                    address,
                    claimables: airdrops?.claimables ? [...airdrops.claimables, ...data.claimables] : data.claimables,
                    currency,
                    fetchedAt: airdrops?.fetchedAt ? { ...airdrops.fetchedAt, [nextPage]: Date.now() } : { [nextPage]: Date.now() },
                    pagination: data.pagination,
                  },
                });
              })
              .finally(() => (paginationPromise = null)),
          };

          return paginationPromise.promise;
        }

        // If the airdrops data is stale, refetch all pages up to the next page
        const pages = Array.from({ length: nextPage }, (_, i) => i + 1);
        paginationPromise = {
          address,
          currency,
          promise: Promise.all(pages.map(page => fetch({ page, pageSize: FULL_PAGE_SIZE }, { force: true, skipStoreUpdates: true })))
            .then(data => {
              const validResults = data.filter(Boolean);
              if (!validResults.length) return;
              set({
                airdrops: {
                  address,
                  claimables: validResults.flatMap(r => r.claimables),
                  currency,
                  fetchedAt: Object.fromEntries(pages.map(page => [page, now])),
                  pagination: validResults[validResults.length - 1]?.pagination ?? null,
                },
              });
            })
            .finally(() => (paginationPromise = null)),
        };

        return paginationPromise.promise;
      }
    },

    getAirdrops: () => {
      const { airdrops, getData } = get();
      const { address, currency } = userAssetsStoreManager.getState();
      if (!address || !airdrops || !airdrops.claimables.length || address !== airdrops.address || currency !== airdrops.currency) {
        return getData()?.claimables || null;
      }
      return airdrops.claimables;
    },

    getCurrentPage: () => get().getPaginationInfo()?.current_page ?? null,

    getFirstCoinIconUrl: size => {
      const airdrops = get().getAirdrops();
      if (!airdrops?.length) return null;
      for (const claimable of airdrops) {
        if (claimable.asset.icon_url) {
          return (size && getSizedImageUrl(claimable.asset.icon_url, size)) || claimable.asset.icon_url;
        }
      }
      return null;
    },

    getNextPage: () => get().getPaginationInfo()?.next ?? null,

    getNumberOfAirdrops: () => get().getData()?.pagination?.total_elements ?? null,

    getPaginationInfo: () => {
      const { airdrops, getData } = get();
      const { address, currency } = userAssetsStoreManager.getState();
      if (!address || !airdrops || !airdrops.claimables.length || address !== airdrops.address || currency !== airdrops.currency) {
        return getData()?.pagination ?? null;
      }
      return airdrops.pagination;
    },

    hasNextPage: () => Boolean(get().getPaginationInfo()?.next),

    markClaimed: (uniqueId: string) => {
      set(state => {
        const { airdrops, queryCache, queryKey, recentlyClaimed } = state;
        const cacheEntry = queryCache[queryKey];

        let newAirdrops: AirdropsState['airdrops'] | null = null;
        let newCacheEntry: CacheEntry<AirdropsQueryData> | null = null;

        if (airdrops?.claimables.length) {
          const result = applyOptimisticClaim(airdrops, uniqueId);
          if (result) newAirdrops = { ...airdrops, ...result };
        }
        if (cacheEntry?.data) {
          const result = applyOptimisticClaim(cacheEntry.data, uniqueId);
          if (result) newCacheEntry = { ...cacheEntry, data: result };
        }

        if (!newAirdrops && !newCacheEntry) return state;

        return {
          ...state,
          airdrops: newAirdrops,
          queryCache: newCacheEntry ? { ...queryCache, [queryKey]: newCacheEntry } : queryCache,
          recentlyClaimed: new Map(recentlyClaimed).set(uniqueId, Date.now()),
        };
      });
    },
  }),

  {
    partialize: state => ({ recentlyClaimed: state.recentlyClaimed }),
    storageKey: 'airdropsStore',
  }
);

async function fetchAirdrops(
  { address, currency, page, pageSize }: AirdropsParams,
  abortController: AbortController | null
): Promise<AirdropsQueryData> {
  if (!address) {
    abortController?.abort();
    return EMPTY_RETURN_DATA;
  }

  const chainIds = useBackendNetworksStore.getState().getSupportedChainIds().join(',');
  const url = `/${chainIds}/${address}/claimables/rainbow?${qs.stringify({
    currency: currency.toLowerCase(),
    page: page.toString(),
    page_size: pageSize.toString(),
  })}`;

  const { data } = await getAddysHttpClient().get<AirdropsResponse>(url, {
    signal: abortController?.signal,
    timeout: time.seconds(20),
  });

  if (data.metadata.status !== 'ok') {
    logger.error(new RainbowError('[fetchTokenLauncherAirdrops]: Failed to fetch airdrop claimables (API error)'), {
      message: data.metadata.errors,
    });
    abortController?.abort();
    return EMPTY_RETURN_DATA;
  }

  const recentlyClaimed = useAirdropsStore.getState().recentlyClaimed;
  const claimables = parseClaimables<RainbowClaimable>(data.payload.claimables, currency, recentlyClaimed);
  const prunedCount = recentlyClaimed ? data.payload.claimables.length - claimables.length : 0;

  return {
    claimables,
    pagination: prunedCount ? { ...data.pagination, total_elements: data.pagination.total_elements - prunedCount } : data.pagination,
  };
}

/**
 * Applies an optimistic claim to an `AirdropsQueryData` object.
 * @returns The updated `AirdropsQueryData`, or `null` if the update has no effect.
 */
function applyOptimisticClaim(data: AirdropsQueryData, uniqueId: string): AirdropsQueryData | null {
  const filteredClaimables = data.claimables.filter(claimable => claimable.uniqueId !== uniqueId);
  if (filteredClaimables.length !== data.claimables.length) {
    const existingPagination = data.pagination;
    const pagination: PaginationInfo | null = existingPagination
      ? { ...existingPagination, total_elements: existingPagination.total_elements - 1 }
      : null;
    return { ...data, claimables: filteredClaimables, pagination };
  }
  return null;
}

function isOnAirdropsRoute(): boolean {
  const { activeRoute } = useNavigationStore.getState();
  return activeRoute === Routes.AIRDROPS_SHEET || activeRoute === Routes.CLAIM_AIRDROP_SHEET;
}

function pruneAirdropsData(
  data: AirdropsQueryData,
  params: AirdropsParams,
  set: (partial: AirdropsState | Partial<AirdropsState> | ((state: AirdropsState) => AirdropsState | Partial<AirdropsState>)) => void
): void {
  // Prune expired optimistic updates
  const { airdrops, getNumberOfAirdrops, recentlyClaimed } = useAirdropsStore.getState();
  let newRecentlyClaimed: Map<UniqueId, Timestamp> | null = null;
  let didPruneRecentlyClaimed = false;

  if (recentlyClaimed?.size) {
    const now = Date.now();
    newRecentlyClaimed = new Map<UniqueId, Timestamp>();
    for (const [uniqueId, timestamp] of recentlyClaimed.entries()) {
      const isExpired = now - timestamp > OPTIMISTIC_UPDATE_EVICTION_TIME;
      if (!isExpired) newRecentlyClaimed.set(uniqueId, timestamp);
      else didPruneRecentlyClaimed = true;
    }
  }
  if (!didPruneRecentlyClaimed) newRecentlyClaimed = recentlyClaimed;

  // Handle airdrops sheet pull-to-refresh case
  const isAirdropsSheetOpen = isOnAirdropsRoute();
  if (isAirdropsSheetOpen && params.page === 1 && params.pageSize === FULL_PAGE_SIZE && params.address) {
    set({
      airdrops: {
        address: params.address,
        claimables: data.claimables,
        currency: params.currency,
        fetchedAt: { [params.page]: Date.now() },
        pagination: data.pagination,
      },
      recentlyClaimed: newRecentlyClaimed,
    });
    return;
  }

  if (!airdrops || isAirdropsSheetOpen) {
    if (didPruneRecentlyClaimed) set({ recentlyClaimed: newRecentlyClaimed });
    return;
  }

  // If outside of the airdrops sheet, check conditions that warrant pruning the airdrops data
  const didNumberOfAirdropsChange = getNumberOfAirdrops() !== airdrops.pagination?.total_elements;
  if (didNumberOfAirdropsChange) {
    set({ airdrops: null, recentlyClaimed: newRecentlyClaimed });
    return;
  }

  const didParamsChange = airdrops.address !== params.address || airdrops.currency !== params.currency;
  if (didParamsChange) {
    set({ airdrops: null, recentlyClaimed: newRecentlyClaimed });
    return;
  }

  const now = Date.now();
  const isStale = Object.values(airdrops.fetchedAt).some(fetchedAt => now - fetchedAt > STALE_TIME);
  if (isStale) set({ airdrops: null, recentlyClaimed: newRecentlyClaimed });
}
