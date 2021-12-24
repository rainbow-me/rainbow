import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountAsset from './useAccountAsset';
import useGenericAsset from './useGenericAsset';
import { AssetTypes } from '@rainbow-me/entities';

// To fetch an asset from account assets,
// generic assets, and uniqueTokens
export default function useAsset(asset) {
  const accountAsset = useAccountAsset(asset?.uniqueId);

  const uniqueTokens = useSelector(
    ({ uniqueTokens: { uniqueTokens } }) => uniqueTokens
  );

  const genericAsset = useGenericAsset(
    asset?.mainnet_address || asset?.address
  );

  return useMemo(() => {
    if (!asset) return null;

    let matched = null;
    if (asset.type === AssetTypes.token) {
      matched = accountAsset ?? genericAsset;
    } else if (asset.type === AssetTypes.nft) {
      matched = find(
        uniqueTokens,
        matchesProperty('uniqueId', asset?.uniqueId)
      );
    }

    return matched || asset;
  }, [accountAsset, asset, uniqueTokens, genericAsset]);
}
