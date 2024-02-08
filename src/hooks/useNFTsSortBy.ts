import { useCallback } from 'react';
import { MMKV, useMMKVString } from 'react-native-mmkv';
import useAccountSettings from './useAccountSettings';

const mmkv = new MMKV();
const getStorageKey = (accountAddress: string) => `nfts-sort-${accountAddress}`;

export enum CollectibleSortByOptions {
  MOST_RECENT = 'most_recent',
  ABC = 'abc',
  FLOOR_PRICE = 'floor_price',
}

export const getNftSortForAddress = (accountAddress: string) => {
  mmkv.getString(getStorageKey(accountAddress));
};

export default function useNftSort(): {
  nftSort: CollectibleSortByOptions;
  updateNFTSort: (sortBy: CollectibleSortByOptions) => void;
} {
  const { accountAddress } = useAccountSettings();
  const [nftSort, setNftSort] = useMMKVString(getStorageKey(accountAddress));

  const updateNFTSort = useCallback(
    (sortBy: CollectibleSortByOptions) => {
      setNftSort(sortBy);
    },
    [setNftSort]
  );

  return {
    updateNFTSort,
    nftSort: (nftSort as CollectibleSortByOptions) || CollectibleSortByOptions.MOST_RECENT,
  };
}
