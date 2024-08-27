import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

const mmkv = new MMKV();
const getStorageKey = (accountAddress: string) => `nfts-sort-${accountAddress}`;

const parseNftSort = (s: string | undefined) => {
  const [sortBy = NftCollectionSortCriterion.MostRecent, sortDirection = SortDirection.Desc] = (s?.split('|') || []) as [
    sortBy?: NftCollectionSortCriterion,
    sortDirection?: SortDirection,
  ];
  return { sortBy, sortDirection } as const;
};

export const getNftSortForAddress = (accountAddress: string) => {
  return parseNftSort(mmkv.getString(getStorageKey(accountAddress)));
};

export type NftSort = `${NftCollectionSortCriterion}|${SortDirection}`;

export function useNftSort() {
  const { accountAddress } = useAccountSettings();
  const [nftSortData, setNftSortData] = useMMKVString(getStorageKey(accountAddress));
  const { sortBy, sortDirection } = parseNftSort(nftSortData);

  return {
    updateNFTSort: (nftSort: NftSort) => setNftSortData(nftSort),
    nftSort: sortBy,
    nftSortDirection: sortDirection,
  };
}
