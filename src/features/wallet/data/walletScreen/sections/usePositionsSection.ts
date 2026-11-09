import { createDerivedStore } from '@storesjs/stores';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { IS_TEST } from '@/env';
import { DEFI_POSITIONS } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { usePositionsStore } from '@/features/positions/stores/positionsStore';
import { useUserAssetsStore } from '@/state/assets/userAssets';

import { useEditTokensStore } from '../base/editStateStore';
import { useCurrentWalletToggles } from '../base/walletListTogglesStore';

const EMPTY_POSITIONS_DATA: CellTypes[] = [];

const POSITIONS_SPACE_BEFORE: CellTypes = {
  type: CellType.POSITIONS_SPACE_BEFORE,
  uid: 'positions-spacer-before',
};

export const usePositionsSection = createDerivedStore($ => {
  const isCoinListEdited = $(useEditTokensStore, s => s.isCoinListEdited);
  const positionsEnabled = $(useExperimentalConfigStore, s => !IS_TEST && s.getFlag(DEFI_POSITIONS));
  const isLoadingUserAssets = $(useUserAssetsStore, s => s.getStatus('isInitialLoad'));
  const positions = $(usePositionsStore, s => s.getData());
  const isPositionCardsOpen = $(useCurrentWalletToggles, s => s.positions);

  if (
    isCoinListEdited ||
    !positionsEnabled ||
    isLoadingUserAssets ||
    !positions?.positions ||
    Object.keys(positions.positions).length === 0
  ) {
    return EMPTY_POSITIONS_DATA;
  }

  const section: CellTypes[] = [
    POSITIONS_SPACE_BEFORE,
    {
      type: CellType.POSITIONS_HEADER,
      uid: 'positions-header',
      total: positions.totals?.total?.display,
    },
  ];

  if (isPositionCardsOpen) {
    const positionSectionItems: CellTypes[] = Object.values(positions.positions).map((position, index) => {
      return {
        type: CellType.POSITION,
        position,
        uid: `position-${position.type}`,
        index,
      };
    });

    section.push(...positionSectionItems);
  }

  return section;
});
