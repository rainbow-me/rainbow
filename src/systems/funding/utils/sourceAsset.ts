import { parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { useUserAssetsStore } from '@/state/assets/userAssets';

import { type DepositConfig } from '../types';

export function resolveInitialDepositAsset(config: DepositConfig) {
  if (config.source.mode === 'fixed') {
    return config.source.resolveAsset();
  }
  const sourceAsset = useUserAssetsStore.getState().getHighestValueNativeAsset();
  return sourceAsset ? parseAssetAndExtend({ asset: sourceAsset }) : null;
}
