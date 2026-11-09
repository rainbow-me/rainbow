import { createDerivedStore } from '@storesjs/stores';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { IS_TEST } from '@/env';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { usePerpsPositionsInfo } from '@/features/perps/stores/derived/usePerpsPositionsInfo';
import { shallowEqual } from '@/worklets/comparisons';

import { useEditTokensStore } from '../base/editStateStore';

const EMPTY_PERPS_DATA: { section: CellTypes[]; hasContent: boolean } = { section: [], hasContent: false };

const PERPS_HEADER_CELL: CellTypes = {
  type: CellType.PERPS_HEADER,
  uid: 'perps-header',
};

const PERPS_HEADER_SPACER: CellTypes = {
  type: CellType.SPACER,
  uid: 'perps-header-spacer',
  height: 8,
};

const PERPS_EMPTY_HEADER_SECTION: CellTypes[] = [PERPS_HEADER_SPACER, PERPS_HEADER_CELL];

export const usePerpsSection = createDerivedStore(
  $ => {
    const isCoinListEdited = $(useEditTokensStore, s => s.isCoinListEdited);
    const perpsEnabledRemote = $(useRemoteConfigStore, s => s.getRemoteConfigKey('perps_enabled'));
    const perpsInfo = $(usePerpsPositionsInfo, s => s);

    if (isCoinListEdited || !perpsEnabledRemote || IS_TEST) return EMPTY_PERPS_DATA;

    const perpsSectionItems: CellTypes[] = [];

    perpsSectionItems.push({
      type: CellType.PERPS_BALANCE,
      balance: perpsInfo.balance,
      uid: 'perps-balance',
    });

    if (perpsInfo.hasPositions) {
      perpsInfo.positions.forEach((position, index) => {
        perpsSectionItems.push({
          index,
          position,
          type: CellType.PERPS_POSITION,
          uid: `perps-position-${position.symbol}-${index}`,
        });
      });
    }

    const hasContent = perpsInfo.hasBalance || perpsInfo.hasPositions;
    const section: CellTypes[] = hasContent ? [PERPS_HEADER_CELL, ...perpsSectionItems] : PERPS_EMPTY_HEADER_SECTION;

    return { hasContent, section };
  },

  { equalityFn: shallowEqual }
);
