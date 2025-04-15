import { UniqueAsset } from '@/entities';

import { createQueryStore } from '../internal/createQueryStore';
import { fetchUserNfts } from '@/resources/nfts';
import { time } from '@/utils';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { createRainbowStore } from '../internal/createRainbowStore';
import { UserNftsState, UserNftsParams, UserNftsResponse } from './types';

type ExternalProfileState = {
  externalProfile: string | null;
  setExternalProfile: (externalProfile: string) => void;
};

export const useExternalProfileStore = createRainbowStore<ExternalProfileState>(set => ({
  externalProfile: null,
  setExternalProfile: (externalProfile: string) => set({ externalProfile }),
}));

export const useExternalNftsStore = createQueryStore<UserNftsResponse, UserNftsParams, UserNftsState, UserNftsResponse>(
  {
    cacheTime: time.weeks(1),
    fetcher: fetchUserNfts,
    setData: ({ data, set }) => {
      set(state => {
        return {
          ...state,
          nftsMap: new Map([...state.nftsMap, ...data.nftsMap]),
          nfts: data.nfts,
        };
      });
    },
    params: {
      address: $ => $(useExternalProfileStore, s => s.externalProfile),
      sortBy: NftCollectionSortCriterion.MostRecent,
      sortDirection: SortDirection.Desc,
    },
    staleTime: time.minutes(10),
  },
  (_, get) => {
    return {
      nftsMap: new Map<string, UniqueAsset>(),
      nfts: [],
      getNfts: () => {
        return Array.from(get().nftsMap.values());
      },
      getNft: (uniqueId: string) => {
        const nft = get().nftsMap.get(uniqueId);
        return nft;
      },
      getNftsForSale: () => {
        const nfts = get().getNfts();
        return nfts.filter(nft => nft.currentPrice);
      },
    };
  }
);
