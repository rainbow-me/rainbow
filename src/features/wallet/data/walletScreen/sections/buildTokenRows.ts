import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { supportedCurrencies } from '@/features/currency/supportedCurrencies';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { greaterThan } from '@/helpers/utilities';

const COINS_TO_SHOW = 5;

/**
 * Builds token rows from balance-ordered wallet holdings and their visible subtotal.
 * Collapsed lists omit below-divider construction; edit mode also includes hidden holdings.
 */
export function buildTokenRows({
  assets,
  balance,
  currency,
  editing,
  pinnedCoins,
  hiddenAssets,
  expanded,
}: {
  assets: Map<UniqueId, ParsedSearchAsset>;
  balance: number;
  currency: NativeCurrencyKey;
  editing: boolean;
  pinnedCoins: Record<string, boolean>;
  hiddenAssets: readonly ParsedSearchAsset[];
  expanded: boolean;
}): CellTypes[] {
  const rows: CellTypes[] = [];
  if (!assets.size && !hiddenAssets.length) return rows;

  let aboveDividerBalance = 0;
  for (const asset of assets.values()) {
    if (!pinnedCoins[asset.uniqueId.toLowerCase()]) continue;
    rows.push(coinRow(asset, true));
    aboveDividerBalance += Number(asset.native.balance.amount) || 0;
  }

  const pinnedCount = rows.length;
  if (pinnedCount < COINS_TO_SHOW) {
    const smallThreshold = supportedCurrencies[currency].smallThreshold;
    for (const asset of assets.values()) {
      if (rows.length === COINS_TO_SHOW) break;
      if (pinnedCoins[asset.uniqueId.toLowerCase()]) continue;
      if (!greaterThan(asset.native.balance.amount, smallThreshold)) break;

      rows.push(coinRow(asset, false));
      aboveDividerBalance += Number(asset.native.balance.amount) || 0;
    }
  }

  if (!rows.length) {
    for (const asset of assets.values()) {
      if (rows.length === COINS_TO_SHOW) break;
      rows.push(coinRow(asset, false));
      aboveDividerBalance += Number(asset.native.balance.amount) || 0;
    }
  }

  const aboveDividerCount = rows.length;
  const hasAssetsBelowDivider = aboveDividerCount < assets.size;
  rows.push({
    type: CellType.COIN_DIVIDER,
    uid: 'coin-divider',
    defaultToEditButton: !hasAssetsBelowDivider,
    value: hasAssetsBelowDivider ? Math.max(0, balance - aboveDividerBalance) : 0,
  });

  if (hasAssetsBelowDivider && (expanded || editing)) {
    let remainingAboveDivider = aboveDividerCount - pinnedCount;
    for (const asset of assets.values()) {
      if (pinnedCoins[asset.uniqueId.toLowerCase()]) continue;
      if (remainingAboveDivider > 0) {
        remainingAboveDivider -= 1;
        continue;
      }
      rows.push(coinRow(asset, false));
    }
  }

  if (editing) {
    for (const asset of hiddenAssets) rows.push(coinRow(asset, Boolean(pinnedCoins[asset.uniqueId.toLowerCase()]), true));
  }
  return rows;
}

function coinRow(asset: ParsedSearchAsset, isPinned: boolean, isHidden = false): CellTypes {
  return { type: CellType.COIN, uid: `coin-${asset.uniqueId}`, asset, isPinned, isHidden };
}
