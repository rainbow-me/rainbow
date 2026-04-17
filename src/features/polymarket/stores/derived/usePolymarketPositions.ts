import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { PolymarketPosition } from '@/features/polymarket/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

export type PolymarketPositions = {
  positions: PolymarketPosition[];
  activePositions: PolymarketPosition[];
  redeemablePositions: PolymarketPosition[];
  lostPositions: PolymarketPosition[];
  hasPositions: boolean;
};

const EMPTY_RESULT: PolymarketPositions = {
  activePositions: [],
  hasPositions: false,
  lostPositions: [],
  positions: [],
  redeemablePositions: [],
};

export const usePolymarketPositions = createDerivedStore<PolymarketPositions>(
  $ => {
    const positions = $(usePolymarketPositionsStore, state => state.getPositions());

    if (!positions?.length) return EMPTY_RESULT;

    let activePositions: PolymarketPosition[] = [];
    let lostPositions: PolymarketPosition[] = [];
    let redeemablePositions: PolymarketPosition[] = [];

    for (const position of positions) {
      const isRedeemable = position.redeemable;
      const isLost = isRedeemable && position.currentValue === 0;

      if (isRedeemable) redeemablePositions.push(position);
      if (isLost) lostPositions.push(position);
      else activePositions.push(position);
    }

    return {
      activePositions,
      hasPositions: true,
      lostPositions,
      positions,
      redeemablePositions,
    };
  },

  { equalityFn: shallowEqual, fastMode: true }
);
