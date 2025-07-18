import { UniqueAsset } from '@/entities';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountAddress } from '@/state/wallets/walletsStore';

export default function useCollectible(uniqueId: string, externalAddress?: string) {
  const accountAddress = useAccountAddress();

  const isExternal = Boolean(externalAddress);
  const address = isExternal ? externalAddress ?? '' : accountAddress;

  const { data: asset } = useLegacyNFTs({
    address,
    config: {
      select: data => {
        const asset = data.nfts[data.nftIndexMap[uniqueId.toLowerCase()]];
        const assetWithIsExternal: UniqueAsset & { isExternal: boolean } = { ...asset, isExternal };
        return assetWithIsExternal;
      },
    },
  });

  return asset;
}
