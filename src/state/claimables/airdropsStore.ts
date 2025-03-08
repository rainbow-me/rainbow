import { ADDYS_API_KEY } from 'react-native-dotenv';
import { qs } from 'url-parse';
import { Address } from 'viem';
import { NativeCurrencyKey } from '@/entities';
import { logger, RainbowError } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { AddysClaimable, Claimable } from '@/resources/addys/claimables/types';
import { parseClaimables } from '@/resources/addys/claimables/utils';
import { AddysConsolidatedError } from '@/resources/addys/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { userAssetsStoreManager } from '../assets/userAssetsStoreManager';

// ============ ⚠️ WIP ⚠️ ====================================================== //

type PaginationInfo = {
  current_page: number;
  next: number | null;
  page_size: number;
  total_elements: number;
  total_pages: number;
};

type AirdropClaimablesResponse = {
  payload: {
    claimables: AddysClaimable[];
    pagination: PaginationInfo;
  };
  metadata: {
    errors?: AddysConsolidatedError[];
    status: string;
  };
};

type AirdropsFetcherParams = {
  address: Address | string | null;
  currency: NativeCurrencyKey;
  page: number;
  pageSize: number;
};

const ADDYS_BASE_URL = 'https://addys.s.rainbow.me/v3';

const addysHttp = new RainbowFetchClient({
  baseURL: ADDYS_BASE_URL,
  headers: {
    Authorization: `Bearer ${ADDYS_API_KEY}`,
  },
});

type AirdropsQueryData = {
  claimables: Claimable[];
  pagination: PaginationInfo | null;
};

type AirdropsState = {
  claimables: Claimable[];
  currentPage: number;
  pagination: PaginationInfo | null;
};

export const useAirdropsStore = createQueryStore<AirdropsQueryData, AirdropsFetcherParams /* , AirdropsState */>(
  {
    fetcher: fetchTokenLauncherAirdrops,
    // setData: ({ data, set }) =>
    //   set({
    //     claimables: data.claimables,
    //     pagination: data.pagination,
    //     currentPage: data.pagination?.current_page || 1,
    //   }),

    cacheTime: ({ page }) => (page === 1 ? time.days(7) : time.hours(1)),
    // debugMode: true,
    disableAutoRefetching: true,
    keepPreviousData: true,
    // staleTime: time.minutes(2),
    staleTime: time.minutes(30),
    params: {
      // address: $ => $(userAssetsStoreManager).address,
      address: '0x50e97E480661533b5382E33705e4ce1EB182222E',
      currency: $ => $(userAssetsStoreManager).currency,
      page: 1,
      pageSize: 100,
    },
  },

  // (_, get) => ({
  //   claimables: [],
  //   currentPage: 1,
  //   pagination: null,

  //   // Helper methods
  //   getClaimables: () => get().claimables,
  //   getPaginationInfo: () => get().pagination,
  //   getCurrentPage: () => get().currentPage,
  //   hasNextPage: () => get().pagination?.next !== null || false,
  //   getTotalPages: () => get().pagination?.total_pages || 0,
  //   getTotalElements: () => get().pagination?.total_elements || 0,
  // }),

  { storageKey: 'tokenLauncherAirdrops2tests' }
);

const EMPTY_RETURN_DATA: AirdropsQueryData = { claimables: [], pagination: null };

async function fetchTokenLauncherAirdrops(
  { address, currency, page, pageSize }: AirdropsFetcherParams,
  abortController: AbortController | null
) {
  if (!address) {
    abortController?.abort();
    return EMPTY_RETURN_DATA;
  }

  try {
    // const chainIds = useBackendNetworksStore.getState().getSupportedChainIds().join(',');
    const chainIds = '1,73571';
    // const url = `/${chainIds}/${address}/claimables/rainbow`;
    const url = `/${chainIds}/${address}/claimables/rainbow?${qs.stringify({
      currency: currency.toLowerCase(),
      page: page.toString(),
      page_size: pageSize.toString(),
    })}`;

    const { data } = await addysHttp.get<AirdropClaimablesResponse>(url, {
      signal: abortController?.signal,
      timeout: time.seconds(20),
    });

    // console.log('data', JSON.stringify(data, null, 2).slice(0, 2500));

    if (data.metadata.status !== 'ok') {
      logger.error(new RainbowError('[fetchTokenLauncherAirdrops]: Failed to fetch airdrop claimables (API error)'), {
        message: data.metadata.errors,
      });
      abortController?.abort();
      return EMPTY_RETURN_DATA;
    }

    return {
      claimables: parseClaimables(data.payload.claimables, currency),
      pagination: data.payload.pagination,
    };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return EMPTY_RETURN_DATA;
    logger.error(new RainbowError('[fetchTokenLauncherAirdrops]: Failed to fetch airdrop claimables (client error)'), {
      message: e instanceof Error ? e.message : String(e),
    });
    return EMPTY_RETURN_DATA;
  }
}
