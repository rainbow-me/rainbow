import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

const mmkv = new MMKV();
const getStorageKey = (accountAddress: string) => `nfts-sort-${accountAddress}`;

const parseNftSort = (s: string | undefined) => {
  if (!s) return [];
  return s.split('|') as [sortBy: NftCollectionSortCriterion, sortDirection?: SortDirection];
};

export const getNftSortForAddress = (accountAddress: string) => {
  const [sortBy] = parseNftSort(mmkv.getString(getStorageKey(accountAddress)));
  return sortBy;
};

const changeDirection = (sortDirection: SortDirection) => (sortDirection === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc);

export function useNftSort() {
  const { accountAddress } = useAccountSettings();
  const [nftSortData, setNftSortData] = useMMKVString(getStorageKey(accountAddress));
  const [nftSort = NftCollectionSortCriterion.MostRecent, nftSortDirection = SortDirection.Desc] = parseNftSort(nftSortData);

  const updateNFTSort = (sortBy: NftCollectionSortCriterion) => {
    const sortDirection = sortBy === nftSort ? changeDirection(nftSortDirection) : nftSortDirection;
    setNftSortData(`${sortBy}|${sortDirection}`);
  };

  return { updateNFTSort, nftSort, nftSortDirection };
}
