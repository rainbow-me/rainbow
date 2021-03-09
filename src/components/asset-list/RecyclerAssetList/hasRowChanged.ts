import { get, has } from 'lodash';
import RecyclerAssetListSharedState from './RecyclerAssetListSharedState';
import { isNewValueForPath } from '@rainbow-me/utils';

export default function hasRowChanged(r1: any, r2: any): boolean {
  const isNewTitle = isNewValueForPath(r1, r2, 'title');
  const isNewTotalItems = isNewValueForPath(r1, r2, 'totalItems');
  const isNewTotalValue = isNewValueForPath(r1, r2, 'totalValue');
  const isNewAsset = isNewValueForPath(r1, r2, 'item.uniqueId');
  const isNewTokenFamilyId = isNewValueForPath(r1, r2, 'item.familyId');
  const isNewTokenFamilyName = isNewValueForPath(r1, r2, 'item.familyName');
  const isNewTokenFamilySize = isNewValueForPath(r1, r2, 'item.childrenAmount');
  const isNewUniswapPercentageOwned = isNewValueForPath(
    r1,
    r2,
    'item.percentageOwned'
  );
  const isNewUniswapToken = isNewValueForPath(r1, r2, 'item.tokenSymbol');
  const isPinned = isNewValueForPath(r1, r2, 'item.isPinned');
  const isNewSmallBalancesRow = isNewValueForPath(
    r1,
    r2,
    'item.smallBalancesContainer'
  );

  // Quickly return for simplistic comparisons.
  if (
    isNewTitle ||
    isNewTotalItems ||
    isNewTotalValue ||
    isNewAsset ||
    isNewTokenFamilyId ||
    isNewTokenFamilyName ||
    isNewTokenFamilySize ||
    isNewUniswapPercentageOwned ||
    isNewUniswapToken ||
    isPinned ||
    isNewSmallBalancesRow
  ) {
    return true;
  }

  const isCollectiblesRow = has(r1, 'item.tokens') && has(r2, 'item.tokens');
  let isNewAssetBalance = false;

  let savingsSectionChanged = false;
  if (r1?.item?.savingsContainer && r2?.item?.savingsContainer) {
    if (r1.item.assets.length !== r2.item.assets.length) {
      savingsSectionChanged = true;
    } else if (r2.item.assets.length > 0) {
      for (let i = 0; i < r2.item.assets.length; i++) {
        if (r1.item.assets[i].supplyRate) {
          if (r1.item.assets[i].supplyRate !== r2.item.assets[i].supplyRate) {
            savingsSectionChanged = true;
          }
        } else if (r1.item.assets[i].supplyBalanceUnderlying) {
          if (
            r1.item.assets[i].supplyBalanceUnderlying !==
            r2.item.assets[i].supplyBalanceUnderlying
          ) {
            savingsSectionChanged = true;
          }
        }
      }
    }
  }

  if (!isCollectiblesRow) {
    isNewAssetBalance = isNewValueForPath(
      r1,
      r2,
      'item.native.balance.display'
    );
  }

  if (r1?.item?.smallBalancesContainer && r2?.item?.smallBalancesContainer) {
    if (r1.item.assets.length !== r2.item.assets.length) {
      RecyclerAssetListSharedState.smallBalancedChanged = true;
    } else if (r2.item.assets.length > 0) {
      for (let i = 0; i < r2.item.assets.length; i++) {
        if (r1.item.assets[i].native && r2.item.assets[i].native) {
          if (
            get(r1.item.assets[i].native, 'balance.display', null) !==
              get(r2.item.assets[i].native, 'balance.display', null) ||
            r1.item.assets[i].isHidden !== r2.item.assets[i].isHidden
          ) {
            RecyclerAssetListSharedState.smallBalancedChanged = true;
          }
        } else if (r1.item.assets[i].isHidden !== r2.item.assets[i].isHidden) {
          RecyclerAssetListSharedState.smallBalancedChanged = true;
        }
      }
    }
  }

  return (
    isNewAssetBalance ||
    savingsSectionChanged ||
    RecyclerAssetListSharedState.smallBalancedChanged
  );
}
