import { useMemo } from 'react';
import useAccountAsset from './useAccountAsset';
import useCollectible from './useCollectible';
import useGenericAsset from './useGenericAsset';
import { AssetTypes } from '@rainbow-me/entities';

// To fetch an asset from account assets,
// generic assets, and uniqueTokens
export default function useAsset(asset) {
  const accountAsset = useAccountAsset(asset?.uniqueId);
  const uniqueToken = useCollectible(asset);
  const genericAsset = useGenericAsset(
    asset?.mainnet_address || asset?.address
  );

  return useMemo(() => {
    if (!asset) return null;

    let matched = null;
    if (asset.type === AssetTypes.token) {
      matched = accountAsset ?? genericAsset;
    } else if (asset.type === AssetTypes.nft) {
      matched = uniqueToken;
    }

    return matched || asset;
  }, [accountAsset, asset, genericAsset, uniqueToken]);
}
