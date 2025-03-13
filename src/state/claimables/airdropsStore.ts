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
import { createQueryStore } from '@/state/internal/createQueryStore';
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

type AirdropsState = {
  airdrops: {
    address: Address | string;
    claimables: RainbowClaimable[];
    currency: NativeCurrencyKey;
    fetchedAt: { [pageNumber: number]: number };
    pagination: PaginationInfo | null;
  } | null;
  fetchNextPage: () => Promise<void>;
  getAirdrops: () => RainbowClaimable[] | null;
  getCurrentPage: () => number | null;
  getFirstCoinIconUrl: (size?: number) => string | null;
  getNextPage: () => number | null;
  getNumberOfAirdrops: () => number | null;
  getPaginationInfo: () => PaginationInfo | null;
  hasNextPage: () => boolean;
};

export const INITIAL_PAGE_SIZE = 12;
export const FULL_PAGE_SIZE = 100;
const EMPTY_RETURN_DATA: AirdropsQueryData = { claimables: [], pagination: null };
const STALE_TIME = time.minutes(3);

let paginationPromise: { address: Address | string; currency: NativeCurrencyKey; promise: Promise<void> } | null = null;

export const useAirdropsStore = createQueryStore<AirdropsQueryData, AirdropsParams, AirdropsState>(
  {
    fetcher: fetchAirdrops,
    onFetched: ({ data, params, set }) => prunePaginatedData(data, params, set),
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

    hasNextPage: () => Boolean(get().getPaginationInfo()?.next),

    getPaginationInfo: () => {
      const { airdrops, getData } = get();
      const { address, currency } = userAssetsStoreManager.getState();
      if (!address || !airdrops || !airdrops.claimables.length || address !== airdrops.address || currency !== airdrops.currency) {
        return getData()?.pagination ?? null;
      }
      return airdrops.pagination;
    },
  }),

  {
    partialize: () => ({}),
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

  try {
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

    return {
      claimables: parseClaimables(data.payload.claimables, currency),
      pagination: data.pagination,
    };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return EMPTY_RETURN_DATA;
    logger.error(new RainbowError('[fetchTokenLauncherAirdrops]: Failed to fetch airdrop claimables (client error)'), {
      message: e instanceof Error ? e.message : String(e),
    });
    return EMPTY_RETURN_DATA;
  }
}

function isOnAirdropsRoute(): boolean {
  const { activeRoute } = useNavigationStore.getState();
  return activeRoute === Routes.AIRDROPS_SHEET || activeRoute === Routes.CLAIM_AIRDROP_SHEET;
}

function prunePaginatedData(
  data: AirdropsQueryData,
  params: AirdropsParams,
  set: (partial: AirdropsState | Partial<AirdropsState> | ((state: AirdropsState) => AirdropsState | Partial<AirdropsState>)) => void
): void {
  const isOnAirdrops = isOnAirdropsRoute();
  if (isOnAirdrops && params.page === 1 && params.pageSize === FULL_PAGE_SIZE && params.address) {
    set({
      airdrops: {
        address: params.address,
        claimables: data.claimables,
        currency: params.currency,
        fetchedAt: { [params.page]: Date.now() },
        pagination: data.pagination,
      },
    });
    return;
  }

  const { airdrops, getNumberOfAirdrops } = useAirdropsStore.getState();
  if (!airdrops || isOnAirdrops) return;

  const didNumberOfAirdropsChange = getNumberOfAirdrops() !== airdrops.pagination?.total_elements;
  if (didNumberOfAirdropsChange) {
    set({ airdrops: null });
    return;
  }

  const didParamsChange = airdrops.address !== params.address || airdrops.currency !== params.currency;
  if (didParamsChange) {
    set({ airdrops: null });
    return;
  }

  const now = Date.now();
  const isStale = Object.values(airdrops.fetchedAt).some(fetchedAt => now - fetchedAt > STALE_TIME);
  if (isStale) set({ airdrops: null });
}
