import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { supportedCurrencies } from '@/features/currency/supportedCurrencies';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { add, greaterThan } from '@/helpers/utilities';

const COINS_TO_SHOW = 5;

export function buildTokenRows({
  assets,
  currency,
  editing,
  pinnedCoins,
  hiddenAssets,
  expanded,
}: {
  assets: Map<UniqueId, ParsedSearchAsset>;
  currency: NativeCurrencyKey;
  editing: boolean;
  pinnedCoins: Record<string, boolean>;
  hiddenAssets: readonly ParsedSearchAsset[];
  expanded: boolean;
}): CellTypes[] {
  if (!assets.size && !hiddenAssets.length) return [];

  const pinned: ParsedSearchAsset[] = [];
  const standard: ParsedSearchAsset[] = [];
  const small: ParsedSearchAsset[] = [];
  for (const asset of assets.values()) {
    if (pinnedCoins[asset.uniqueId.toLowerCase()]) {
      pinned.push(asset);
    } else if (greaterThan(asset.native.balance.amount, supportedCurrencies[currency].smallThreshold)) {
      standard.push(asset);
    } else {
      small.push(asset);
    }
  }

  const visible = [...pinned, ...standard];
  const dividerIndex = Math.max(pinned.length, COINS_TO_SHOW);
  const above = visible.length ? visible.slice(0, dividerIndex) : small.slice(0, COINS_TO_SHOW);
  const below = visible.length ? [...visible.slice(dividerIndex), ...small] : small.slice(COINS_TO_SHOW);
  const smallBalance = below.reduce((total, asset) => add(total, asset.native.balance.amount), '0');
  const rows: CellTypes[] = [];
  for (const asset of above) rows.push(row(asset, false));
  rows.push({ type: CellType.COIN_DIVIDER, uid: 'coin-divider', defaultToEditButton: !below.length, value: Number(smallBalance) });
  if (expanded || editing) {
    for (const asset of below) rows.push(row(asset, false));
  }
  if (editing) {
    for (const asset of hiddenAssets) rows.push(row(asset, true));
  }
  return rows;

  function row(asset: ParsedSearchAsset, isHidden: boolean): CellTypes {
    return {
      type: CellType.COIN,
      uid: `coin-${asset.uniqueId}`,
      uniqueId: asset.uniqueId,
      isPinned: Boolean(pinnedCoins[asset.uniqueId.toLowerCase()]),
      isHidden,
    };
  }
}
