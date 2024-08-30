import { useCallback } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';
import { NftCollectionSortCriterion } from '@/graphql/__generated__/arc';

const mmkv = new MMKV();
const getStorageKey = (accountAddress: string) => `nfts-sort-${accountAddress}`;

export const getNftSortForAddress = (accountAddress: string) => {
  return mmkv.getString(getStorageKey(accountAddress)) as NftCollectionSortCriterion;
};

export default function useNftSort(): {
  nftSort: NftCollectionSortCriterion;
  updateNFTSort: (sortBy: NftCollectionSortCriterion) => void;
} {
  const { accountAddress } = useAccountSettings();
  const [nftSort, setNftSort] = useMMKVString(getStorageKey(accountAddress));

  const updateNFTSort = useCallback(
    (sortBy: NftCollectionSortCriterion) => {
      setNftSort(sortBy);
    },
    [setNftSort]
  );

  return {
    updateNFTSort,
    nftSort: (nftSort as NftCollectionSortCriterion) || NftCollectionSortCriterion.MostRecent,
  };
}
