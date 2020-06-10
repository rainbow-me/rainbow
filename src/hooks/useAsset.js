import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';
import AssetTypes from '../helpers/assetTypes';
import useAccountAssets from './useAccountAssets';

export default function useAsset(asset) {
  const { allAssets, collectibles } = useAccountAssets();

  return useMemo(() => {
    if (!asset) return null;

    let matched = null;
    if (asset.type === AssetTypes.token) {
      matched = find(allAssets, matchesProperty('address', asset.address));
    } else if (asset.type === AssetTypes.nft) {
      matched = find(collectibles, matchesProperty('uniqueId', asset.uniqueId));
    }

    return matched || asset;
  }, [allAssets, asset, collectibles]);
}
