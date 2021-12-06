import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { AssetTypes } from '@rainbow-me/entities';

export default function useAsset(asset: any) {
  const { allAssets, collectibles } = useAccountAssets();
  const genericAssets = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
    ({ data: { genericAssets } }) => genericAssets
  );
  const uniswapAssetsInWallet = useUniswapAssetsInWallet();

  return useMemo(() => {
    if (!asset) return null;

    let matched = null;
    if (asset.type === AssetTypes.token) {
      const uniswapAsset = find(
        uniswapAssetsInWallet,
        matchesProperty('address', asset.mainnet_address || asset.address)
      );

      matched = uniswapAsset
        ? uniswapAsset
        : find(
            allAssets,
            matchesProperty('address', asset.mainnet_address || asset.address)
          );
      if (!matched) {
        matched = genericAssets?.[asset.mainnet_address || asset.address];
      }
    } else if (asset.type === AssetTypes.nft) {
      matched = find(collectibles, matchesProperty('uniqueId', asset.uniqueId));
    }

    return matched || asset;
  }, [allAssets, asset, collectibles, genericAssets, uniswapAssetsInWallet]);
}
