import { useMemo } from 'react';

import useCoinListEdited from '@/hooks/useCoinListEdited';
import useOpenClaimables from '@/hooks/useOpenClaimables';
import useOpenPolymarket from '@/hooks/useOpenPolymarket';
import useOpenPositionCards from '@/hooks/useOpenPositionCards';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useOpenSmallBalances } from '@/state/wallets/smallBalancesStore';

import { CellType, type CellTypes } from './ViewTypes';

export default function useMemoBriefSectionData(briefSectionsData: CellTypes[]): CellTypes[] {
  const { isSmallBalancesOpen } = useOpenSmallBalances();
  const { isPositionCardsOpen } = useOpenPositionCards();
  const { isClaimablesOpen } = useOpenClaimables();
  const { isPolymarketOpen } = useOpenPolymarket();
  const { isCoinListEdited } = useCoinListEdited();
  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);

  return useMemo(() => {
    let afterDivider = false;
    let afterCoins = false;
    return briefSectionsData.filter((data, arrIndex, arr) => {
      if (arr[arrIndex - 1]?.type === CellType.COIN && data.type !== CellType.COIN_DIVIDER && data.type !== CellType.COIN) {
        afterCoins = true;
      }
      if (afterCoins && isCoinListEdited) {
        return false;
      }

      if (data.type === CellType.COIN && !isSmallBalancesOpen && !isCoinListEdited && afterDivider) {
        return false;
      }
      if (data.type === CellType.COIN && hiddenAssets.has(data.uniqueId) && !isCoinListEdited) {
        return false;
      }

      if (data.type === CellType.COIN_DIVIDER) {
        afterDivider = true;
      }

      if (data.type === CellType.POSITION && !isPositionCardsOpen) {
        return false;
      }

      if (data.type === CellType.CLAIMABLE && !isClaimablesOpen) {
        return false;
      }

      if ((data.type === CellType.POLYMARKET_POSITION || data.type === CellType.POLYMARKET_BALANCE) && !isPolymarketOpen) {
        return false;
      }

      return true;
    });
  }, [briefSectionsData, isCoinListEdited, isSmallBalancesOpen, hiddenAssets, isPositionCardsOpen, isClaimablesOpen, isPolymarketOpen]);
}
