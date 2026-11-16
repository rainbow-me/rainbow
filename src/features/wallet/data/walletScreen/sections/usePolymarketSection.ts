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
    const balance = $(usePolymarketAccountValueSummary, s => s.balance);
    const hasBalance = $(usePolymarketAccountValueSummary, s => s.hasBalance);
    const totalValueNative = $(usePolymarketAccountValueSummary, s => s.totalValueNative);
    const activePositions = $(usePolymarketPositions, state => state.activePositions);
    const isPolymarketOpen = $(useCurrentWalletToggles, s => s.predictions);

    if (isCoinListEdited || !polymarketEnabledRemote || IS_TEST) return EMPTY_POLYMARKET_DATA;

    const hasContent = hasBalance || activePositions.length > 0;

    const headerCell: CellTypes = {
      type: CellType.POLYMARKET_HEADER,
      uid: 'polymarket-header',
      hasContent,
      totalValueNative,
    };

    const section: CellTypes[] = [POLYMARKET_HEADER_SPACER, headerCell];

    if (hasContent && isPolymarketOpen) {
      section.push({
        type: CellType.POLYMARKET_BALANCE,
        balance,
        uid: 'polymarket-balance',
      });

      for (let index = 0; index < activePositions.length; index++) {
        const position = activePositions[index];
        section.push({
          index,
          position,
          type: CellType.POLYMARKET_POSITION,
          uid: `polymarket-position-${position.slug}-${index}`,
        });
      }
    }

    return { hasContent, section };
  },

  { equalityFn: shallowEqual, lockDependencies: true }
);
