import { useMemo } from 'react';
import useAccountAsset from './useAccountAsset';
import useCollectible from './useCollectible';
import { AssetTypes } from '@rainbow-me/entities';

// To fetch an asset from account assets,
// generic assets, and uniqueTokens
export default function useAsset(
  asset,
  { revalidateCollectibleInBackground = false } = {}
) {
  const accountAsset = useAccountAsset(
    asset?.uniqueId || asset?.mainnet_address || asset?.address
  );
  const uniqueToken = useCollectible(asset, {
    revalidateInBackground: revalidateCollectibleInBackground,
  });
  return useMemo(() => {
    if (!asset) return null;

    let matched = null;
    if (asset.type === AssetTypes.token) {
      matched = accountAsset;
    } else if (asset.type === AssetTypes.nft) {
      matched = uniqueToken;
    }

    return matched || asset;
  }, [accountAsset, asset, uniqueToken]);
}
