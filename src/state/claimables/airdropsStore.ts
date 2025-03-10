import { ADDYS_BASE_URL, ADDYS_API_KEY } from 'react-native-dotenv';
import { qs } from 'url-parse';
import { Address } from 'viem';
import { NativeCurrencyKey } from '@/entities';
import { logger, RainbowError } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { AddysClaimable, Claimable as AirdropClaimable } from '@/resources/addys/claimables/types';
import { parseClaimables } from '@/resources/addys/claimables/utils';
import { AddysConsolidatedError } from '@/resources/addys/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

const addysHttp = new RainbowFetchClient({
  baseURL: ADDYS_BASE_URL,
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

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
  claimables: AirdropClaimable[];
  pagination: PaginationInfo | null;
};

type AirdropsState = {
  airdrops: {
    address: Address | string;
    claimables: AirdropClaimable[];
    currency: NativeCurrencyKey;
    fetchedAt: { [pageNumber: number]: number };
    pagination: PaginationInfo | null;
  } | null;
  fetchNextPage: () => Promise<void>;
  getAirdrops: () => AirdropClaimable[] | null;
  getCurrentPage: () => number | null;
  getNextPage: () => number | null;
  getNumberOfAirdrops: () => number | null;
  getPaginationInfo: () => PaginationInfo | null;
  hasNextPage: () => boolean;
};

const EMPTY_RETURN_DATA: AirdropsQueryData = { claimables: [], pagination: null };
const INITIAL_PAGE_SIZE = 12;
const FULL_PAGE_SIZE = 100;
const STALE_TIME = time.minutes(5);

export const useAirdropsStore = createQueryStore<AirdropsQueryData, AirdropsParams, AirdropsState>(
  {
    fetcher: fetchTokenLauncherAirdrops,

    cacheTime: time.days(1),
    staleTime: STALE_TIME,
    params: {
      address: $ => $(userAssetsStoreManager).address,
      currency: $ => $(userAssetsStoreManager).currency,
      page: 1,
      pageSize: INITIAL_PAGE_SIZE,
    },
  },

  (set, get) => ({
    airdrops: null,

    async fetchNextPage() {
      const { airdrops: storedAirdrops, fetch, getPaginationInfo } = get();
      const { address, currency } = userAssetsStoreManager.getState();

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
          const data = await fetch({ page: nextPage, pageSize: FULL_PAGE_SIZE }, { force: true, skipStoreUpdates: true });
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
          return;
        }

        // If the airdrops data is stale, refetch all pages up to the next page
        const pages = Array.from({ length: nextPage }, (_, i) => i + 1);
        const data = await Promise.all(
          pages.map(page => fetch({ page, pageSize: FULL_PAGE_SIZE }, { force: true, skipStoreUpdates: true }))
        );
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
      }
    },

    getAirdrops: () => {
      const { airdrops, getData } = get();
      const { address, currency } = userAssetsStoreManager.getState();
      if (!address || !airdrops || address !== airdrops.address || currency !== airdrops.currency) {
        return getData()?.claimables || null;
      }
      return airdrops.claimables;
    },

    getCurrentPage: () => get().getPaginationInfo()?.current_page ?? null,

    getNextPage: () => get().getPaginationInfo()?.next ?? null,

    getNumberOfAirdrops: () => get().getPaginationInfo()?.total_elements ?? null,

    hasNextPage: () => Boolean(get().getPaginationInfo()?.next),

    getPaginationInfo: () => {
      const { airdrops, getData } = get();
      const { address, currency } = userAssetsStoreManager.getState();
      if (!address || !airdrops || address !== airdrops.address || currency !== airdrops.currency) {
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

async function fetchTokenLauncherAirdrops(
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

    const { data } = await addysHttp.get<AirdropsResponse>(url, {
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
