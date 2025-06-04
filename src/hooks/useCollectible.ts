import { UniqueAsset } from '@/entities';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings } from '.';
import { useNftSort } from './useNFTsSortBy';

export default function useCollectible(uniqueId: string, externalAddress?: string) {
  const { accountAddress } = useAccountSettings();

  const isExternal = Boolean(externalAddress);
  const address = isExternal ? externalAddress ?? '' : accountAddress;

  const { nftSort, nftSortDirection } = useNftSort();

  const { data: asset } = useLegacyNFTs({
    address,
    sortBy: nftSort,
    sortDirection: nftSortDirection,
    config: {
      select: data => {
        const asset = data.nfts[data.nftIndexMap[uniqueId]];
        const assetWithIsExternal: UniqueAsset & { isExternal: boolean } = { ...asset, isExternal };
        return assetWithIsExternal;
      },
    },
  });

  return asset;
}
