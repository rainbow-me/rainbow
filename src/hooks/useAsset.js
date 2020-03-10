import { useMemo } from 'react';
import { ethereumUtils } from '../utils';
import useAccountAssets from './useAccountAssets';

export default function useAsset(asset) {
  const { allAssets } = useAccountAssets();

  return useMemo(
    () => ethereumUtils.getAsset(allAssets, asset.address) || asset,
    [allAssets, asset]
  );
}
