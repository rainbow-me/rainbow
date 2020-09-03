import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';
import useAccountAssets from './useAccountAssets';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';
import AssetTypes from '@rainbow-me/helpers/assetTypes';

export default function useAsset(asset) {
  const { allAssets, collectibles } = useAccountAssets();
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
    } else if (asset.type === AssetTypes.nft) {
      matched = find(collectibles, matchesProperty('uniqueId', asset.uniqueId));
    }

    return matched || asset;
  }, [allAssets, asset, collectibles, uniswapAssetsInWallet]);
}
