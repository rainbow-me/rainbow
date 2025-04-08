import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import useAccountSettings from './useAccountSettings';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

export const parseNftSort = (s: string | undefined) => {
  const [sortBy = NftCollectionSortCriterion.MostRecent, sortDirection = SortDirection.Desc] = (s?.split('|') || []) as [
    sortBy?: NftCollectionSortCriterion,
    sortDirection?: SortDirection,
  ];
  return [sortBy, sortDirection] as const;
};

export function useNftSort() {
  const { accountAddress } = useAccountSettings();
  const { sortBy, sortDirection } = useNftSortStore(s => s.getNftSort(accountAddress));
  const updateNftSort = useNftSortStore(s => s.updateNftSort);

  return {
    updateNFTSort: (nftSort: NftSortAction) => updateNftSort(accountAddress, nftSort),
    nftSort: sortBy,
    nftSortDirection: sortDirection,
  };
}

export type NftSortAction = `${NftCollectionSortCriterion}|${SortDirection}`;
type NftSortByAddress = Record<string, NftSortAction>;
interface NftSortStore {
  nftSort: NftSortByAddress;
  getNftSort: (address?: string) => { sortBy: NftCollectionSortCriterion; sortDirection: SortDirection };
  updateNftSort: (address: string, params: NftSortAction) => void;
}

const DEFAULT_NFT_SORT = { sortBy: NftCollectionSortCriterion.MostRecent, sortDirection: SortDirection.Desc };

export const useNftSortStore = createRainbowStore<NftSortStore>(
  (set, get) => ({
    nftSort: {},
    getNftSort: () => {
      const addressFromUserAssets = userAssetsStoreManager.getState().address;
      if (!addressFromUserAssets) {
        return DEFAULT_NFT_SORT;
      }
      const currentSort = get().nftSort?.[addressFromUserAssets];
      const [sortBy, sortDirection] = parseNftSort(currentSort);
      return {
        sortBy,
        sortDirection,
      };
    },
    updateNftSort: (address, sortAction) => {
      const state = get();
      set({
        ...state,
        nftSort: {
          ...state.nftSort,
          [address]: sortAction,
        },
      });
    },
  }),
  {
    storageKey: 'nftSort',
    version: 0,
  }
);
