import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';
import { AssetTypes } from '@rainbow-me/entities';

export default function useAsset(asset) {
  const { allAssets, collectibles } = useAccountAssets();
  const genericAssets = useSelector(
    ({ data: { genericAssets } }) => genericAssets
  );
  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();

  return useMemo(() => {
    if (!asset) return null;

    let matched = null;
    if (asset.type === AssetTypes.token) {
      const uniswapAsset = find(
        uniswapAssetsInWallet,
        matchesProperty('address', asset.address)
      );

      matched = uniswapAsset
        ? uniswapAsset
        : find(allAssets, matchesProperty('address', asset.address));
      if (!matched) {
        matched = genericAssets?.[asset.address];
      }
    } else if (asset.type === AssetTypes.nft) {
      matched = find(collectibles, matchesProperty('uniqueId', asset.uniqueId));
    }

    return matched || asset;
  }, [allAssets, asset, collectibles, genericAssets, uniswapAssetsInWallet]);
}
