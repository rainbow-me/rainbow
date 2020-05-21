import { useMemo } from 'react';
import { ethereumUtils } from '../utils';
import useAccountAssets from './useAccountAssets';

export default function useAsset(asset) {
  const { allAssets } = useAccountAssets();

  return useMemo(() => {
    if (asset.type === 'token') {
      return ethereumUtils.getAsset(allAssets, asset.address) || asset;
    }

    return asset;
  }, [allAssets, asset]);
}
