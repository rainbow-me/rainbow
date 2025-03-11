import { TokenLauncherSDK } from '@/hooks/useTokenLauncher';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { GetAirdropSuggestionsResponse } from '@rainbow-me/token-launcher';

// address can be initially null due to coming from redux. Should never happen by time this store is used but for types we have to handle it
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

type AirdropSuggestionsParams = {
  address: string | null;
};

export const useAirdropSuggestionsStore = createQueryStore<GetAirdropSuggestionsResponse, AirdropSuggestionsParams>(
  {
    // fetcher: airdropSuggestionsQueryFunction,
    fetcher: async ({ address }) => {
      if (!address) return noSuggestionsData;
      const suggestions = await TokenLauncherSDK.getAirdropSuggestions(address);
      return suggestions;
    },
    cacheTime: time.days(1),
    keepPreviousData: true,
    params: { address: $ => $(userAssetsStoreManager).address },
    staleTime: time.minutes(15),
    disableAutoRefetching: true,
  },

  { storageKey: 'airdropSuggestions' }
);
