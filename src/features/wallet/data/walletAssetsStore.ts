import { createDerivedStore, shallowEqual } from '@storesjs/stores';

import type { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/entities/assetId';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import type { RainbowPositions } from '@/features/positions/types';
import type { UserAssetsState } from '@/state/assets/types';
import { useUserAssetsStore } from '@/state/assets/userAssets';

const POSITION_ASSET_CATEGORIES = ['deposits', 'pools', 'stakes', 'borrows'] as const;
const EMPTY_HIDDEN_ASSETS: readonly ParsedSearchAsset[] = [];

/**
 * Wallet holdings split by visibility, excluding holdings represented
 * by positions. The balance includes only visible holdings.
 */
export const useWalletAssetsStore = createDerivedStore(
  $ => {
    const userAssets = $(useUserAssetsStore, s => s.userAssets);
    const hiddenAssetIds = $(useUserAssetsStore, s => s.hiddenAssets);
    const positions = $(usePositionsStore, s => s.getData()?.positions);

    let assets = excludePositionTokens(userAssets, positions);
    let hiddenAssets: ParsedSearchAsset[] | undefined;
    let balance = 0;

    for (const asset of assets.values()) {
      if (hiddenAssetIds.has(asset.uniqueId)) {
        if (assets === userAssets) assets = new Map(userAssets);
        assets.delete(asset.uniqueId);
        (hiddenAssets ??= []).push(asset);
        continue;
      }

      balance += Number(asset.native.balance.amount) || 0;
    }

    return { assets, hiddenAssets: hiddenAssets ?? EMPTY_HIDDEN_ASSETS, balance };
  },
  { equalityFn: shallowEqual, lockDependencies: true }
);

/**
 * Excludes asset holdings whose address and chain match a
 * position's pool. Returns the original map when no holdings match.
 */
function excludePositionTokens(
  userAssets: UserAssetsState['userAssets'],
  positions: RainbowPositions['positions'] | undefined
): UserAssetsState['userAssets'] {
  if (!positions) return userAssets;

  let assets = userAssets;

  for (const protocol in positions) {
    const position = positions[protocol];

    for (const category of POSITION_ASSET_CATEGORIES) {
      for (const item of position[category]) {
        if (!item.poolAddress) continue;

        const assetId = getUniqueId(item.poolAddress.toLowerCase(), item.asset.chainId);
        if (!assets.has(assetId)) continue;

        if (assets === userAssets) assets = new Map(userAssets);
        assets.delete(assetId);
      }
    }
  }

  return assets;
}
