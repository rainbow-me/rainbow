import { useMemo } from 'react';
import useAccountAsset from './useAccountAsset';
import useCollectible from './useCollectible';
import { AssetTypes, ParsedAddressAsset } from '@/entities';
import useGenericAsset from './useGenericAsset';

// To fetch an asset from account assets,
// generic assets, and uniqueTokens
export default function useAsset(asset: ParsedAddressAsset) {
  const accountAsset = useAccountAsset(
    asset?.uniqueId || asset?.mainnet_address || asset?.address
  );
  const genericAsset = useGenericAsset(
    asset?.uniqueId || asset?.mainnet_address || asset?.address
  );
  const uniqueToken = useCollectible(asset);
  return useMemo(() => {
    if (!asset) return null;

    let matched = null;
    if (asset.type === AssetTypes.nft) {
      matched = uniqueToken;
    } else if (accountAsset) {
      matched = accountAsset;
    } else if (genericAsset) {
      matched = genericAsset;
    }

    return matched || asset;
  }, [accountAsset, asset, genericAsset, uniqueToken]);
}
