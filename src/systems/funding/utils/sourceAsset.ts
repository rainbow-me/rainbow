import { parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useUserAssetSearch } from '@/state/assets/userAssetsSearch';

import { type DepositConfig } from '../types';

export function resolveInitialDepositAsset(config: DepositConfig) {
  if (config.source.mode === 'fixed') {
    return config.source.resolveAsset();
  }

  const { defaultAssetIds } = useUserAssetSearch.getState();
  const { userAssets } = useUserAssetsStore.getState();
  const sourceId = defaultAssetIds.find(id => userAssets.get(id)?.isNativeAsset) ?? defaultAssetIds[0];
  const sourceAsset = sourceId ? userAssets.get(sourceId) : null;

  return sourceAsset ? parseAssetAndExtend({ asset: sourceAsset }) : null;
}
