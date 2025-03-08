import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';

export type AirdropCohort = {
  id: string;
  name: string;
  icons: {
    iconURL: string;
    pfp1URL?: string;
    pfp2URL?: string;
  };
  totalUsers: number;
};

export type AirdropPersonalizedCohort = AirdropCohort & {
  // TODO: tell backend to add id to the response
  id?: string;
  addresses: AirdropSuggestedUser[];
};

export type AirdropSuggestedUser = {
  username: string;
  address: string;
  pfpURL: string;
  type: string;
  typeIconURL: string;
};

export type AirdropSuggestions = {
  meta: {
    maxUserAllocations: number;
  };
  data: {
    predefinedCohorts: AirdropCohort[];
    personalizedCohorts: AirdropPersonalizedCohort[];
    suggestedUsers: AirdropSuggestedUser[];
  };
};

// TODO: below is temporary, real fetch function will come from sdk
const tokenLauncherHttp = new RainbowFetchClient({
  baseURL: 'https://token-launcher-api.rainbowdotme.workers.dev',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: time.seconds(30),
});
export type AirdropSuggestionsParams = {
  address: string | null;
};
const noSuggestionsData = {
  meta: {
    maxUserAllocations: 0,
  },
  data: {
    predefinedCohorts: [],
    personalizedCohorts: [],
    suggestedUsers: [],
  },
};
async function airdropSuggestionsQueryFunction({ address }: AirdropSuggestionsParams, abortController: AbortController | null) {
  if (!address) return noSuggestionsData;

  const url = `/v1/airdrop/${address}/suggestions`;
  try {
    const airdropSuggestions = await tokenLauncherHttp.get<AirdropSuggestions>(url, { abortController });
    console.log('airdropSuggestions', JSON.stringify(airdropSuggestions.data.data.suggestedUsers, null, 2));
    return airdropSuggestions.data;
  } catch (e) {
    logger.error(new RainbowError('[airdropSuggestionsQueryFunction]: Airdrop suggestions failed'), { url });
  }

  return noSuggestionsData;
}

export const useAirdropSuggestionsStore = createQueryStore<AirdropSuggestions, AirdropSuggestionsParams>(
  {
    fetcher: airdropSuggestionsQueryFunction,
    cacheTime: time.days(1),
    keepPreviousData: true,
    params: { address: $ => $(userAssetsStoreManager).address },
    staleTime: time.minutes(15),
    disableAutoRefetching: true,
  },

  { storageKey: 'airdropSuggestions' }
);
