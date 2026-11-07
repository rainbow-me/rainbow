import { createDerivedStore } from '@storesjs/stores';

import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { type PolymarketPosition } from '@/features/polymarket/types';
import { shallowEqual } from '@/worklets/comparisons';

export type PolymarketPositions = {
  positions: PolymarketPosition[];
  activePositions: PolymarketPosition[];
  lostPositions: PolymarketPosition[];
};

const EMPTY_RESULT: PolymarketPositions = {
  positions: [],
  activePositions: [],
  lostPositions: [],
};

export const usePolymarketPositions = createDerivedStore<PolymarketPositions>(
  $ => {
    const positionsByAsset = $(usePolymarketPositionsStore, state => state.getData());
    if (!positionsByAsset) return EMPTY_RESULT;

    const positions = Object.values(positionsByAsset).sort(comparePositions);
    if (!positions.length) return EMPTY_RESULT;

    const activePositions: PolymarketPosition[] = [];
    const lostPositions: PolymarketPosition[] = [];

    for (const position of positions) {
      if (position.redeemable && position.currentValue === 0) {
        lostPositions.push(position);
      } else {
        activePositions.push(position);
      }
    }

    return { positions, activePositions, lostPositions };
  },

  { equalityFn: shallowEqual, lockDependencies: true }
);

// ============ Position Ordering ============================================== //

function comparePositions(a: PolymarketPosition, b: PolymarketPosition): number {
  const priorityDiff = getPositionSortPriority(a) - getPositionSortPriority(b);
  if (priorityDiff !== 0) return priorityDiff;
  return b.currentValue - a.currentValue;
}

function getPositionSortPriority(position: PolymarketPosition): number {
  if (!position.redeemable) return 0;
  if (position.size === position.currentValue) return 1;
  return 2;
}
