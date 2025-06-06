import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { useMMKVString } from 'react-native-mmkv';
import { useAccountAddress } from '@/state/wallets/walletsStore';

const getStorageKey = (accountAddress: string) => `nfts-sort-${accountAddress}`;

export const parseNftSort = (s: string | undefined) => {
  const [sortBy = NftCollectionSortCriterion.MostRecent, sortDirection = SortDirection.Desc] = (s?.split('|') || []) as [
    sortBy?: NftCollectionSortCriterion,
    sortDirection?: SortDirection,
  ];
  return [sortBy, sortDirection] as const;
};

export type NftSort = `${NftCollectionSortCriterion}|${SortDirection}`;

export function useNftSort() {
  const accountAddress = useAccountAddress();
  const [nftSortData, setNftSortData] = useMMKVString(getStorageKey(accountAddress));
  const [sortBy, sortDirection] = parseNftSort(nftSortData);

  return {
    updateNFTSort: (nftSort: NftSort) => setNftSortData(nftSort),
    nftSort: sortBy,
    nftSortDirection: sortDirection,
  };
}
