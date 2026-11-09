import { createDerivedStore } from '@storesjs/stores';

import { CellType, type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { IS_TEST } from '@/env';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { usePolymarketAccountValueSummary } from '@/features/polymarket/stores/derived/usePolymarketAccountValueSummary';
import { usePolymarketPositions } from '@/features/polymarket/stores/derived/usePolymarketPositions';
import { shallowEqual } from '@/worklets/comparisons';

import { useEditTokensStore } from '../base/editStateStore';
import { useCurrentWalletToggles } from '../base/walletListTogglesStore';

const EMPTY_POLYMARKET_DATA: { section: CellTypes[]; hasContent: boolean } = { section: [], hasContent: false };

const POLYMARKET_HEADER_SPACER: CellTypes = {
  type: CellType.SPACER,
  uid: 'polymarket-header-spacer',
  height: 8,
};

export const usePolymarketSection = createDerivedStore(
  $ => {
    const isCoinListEdited = $(useEditTokensStore, s => s.isCoinListEdited);
    const polymarketEnabledRemote = $(useRemoteConfigStore, s => s.getRemoteConfigKey('polymarket_enabled'));
    const { balance, hasBalance, totalValueNative } = $(usePolymarketAccountValueSummary);
    const activePositions = $(usePolymarketPositions, state => state.activePositions);
    const hasPositions = activePositions.length > 0;
    const isPolymarketOpen = $(useCurrentWalletToggles, s => s.predictions);

    if (isCoinListEdited || !polymarketEnabledRemote || IS_TEST) return EMPTY_POLYMARKET_DATA;

    const hasContent = hasBalance || hasPositions;

    const headerCell: CellTypes = {
      type: CellType.POLYMARKET_HEADER,
      uid: 'polymarket-header',
      hasContent,
      totalValueNative,
    };

    const section: CellTypes[] = hasContent ? [headerCell] : [POLYMARKET_HEADER_SPACER, headerCell];

    if (hasContent && isPolymarketOpen) {
      section.push({
        type: CellType.POLYMARKET_BALANCE,
        balance,
        uid: 'polymarket-balance',
      });

      if (hasPositions) {
        for (let i = 0; i < activePositions.length; i++) {
          const position = activePositions[i];
          section.push({
            index: i,
            position,
            type: CellType.POLYMARKET_POSITION,
            uid: `polymarket-position-${position.slug}-${i}`,
          });
        }
      }
    }

    return { hasContent, section };
  },

  { equalityFn: shallowEqual }
);
