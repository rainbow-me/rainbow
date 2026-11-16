import { useMemo } from 'react';

import useCoinListEdited from '@/hooks/useCoinListEdited';
import useOpenClaimables from '@/hooks/useOpenClaimables';
import useOpenPolymarket from '@/hooks/useOpenPolymarket';
import useOpenPositionCards from '@/hooks/useOpenPositionCards';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { useOpenSmallBalances } from '@/state/wallets/smallBalancesStore';

import { type AssetListType } from '..';
import { CellType, type CellTypes } from './ViewTypes';

const FILTER_TYPES: Partial<Record<AssetListType, CellType[]>> = {
  'ens-profile': [CellType.NFT_SPACE_AFTER, CellType.LEGACY_NFT, CellType.LEGACY_FAMILY_HEADER],
  'select-nft': [CellType.NFT_SPACE_AFTER, CellType.NFT, CellType.FAMILY_HEADER],
};

export default function useMemoBriefSectionData({
  type,
  briefSectionsData,
}: {
  type: AssetListType;
  briefSectionsData: CellTypes[];
}): CellTypes[] {
  const { isSmallBalancesOpen } = useOpenSmallBalances();
  const { isPositionCardsOpen } = useOpenPositionCards();
  const { isClaimablesOpen } = useOpenClaimables();
  const { isPolymarketOpen } = useOpenPolymarket();
  const { isCoinListEdited } = useCoinListEdited();
  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const openCollections = useOpenCollectionsStore(state => state.openCollections);

  return useMemo(() => {
    let afterDivider = false;
    let isGroupOpen = true;
    let afterCoins = false;
    const filterTypes = FILTER_TYPES[type];
    return briefSectionsData.filter((data, arrIndex, arr) => {
      if (filterTypes && !filterTypes.includes(data.type)) {
        return false;
      }

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

      if (data.type === CellType.LEGACY_FAMILY_HEADER) {
        const name = data.name;
        isGroupOpen = openCollections[name.toLowerCase()] ?? false;
      }

      if (type === 'ens-profile' && (data.type === CellType.LEGACY_NFT || data.type === CellType.NFT_SPACE_AFTER)) {
        return isGroupOpen;
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
  }, [
    briefSectionsData,
    type,
    isCoinListEdited,
    isSmallBalancesOpen,
    hiddenAssets,
    isPositionCardsOpen,
    isClaimablesOpen,
    isPolymarketOpen,
    openCollections,
  ]);
}
