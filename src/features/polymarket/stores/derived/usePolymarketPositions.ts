import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { PolymarketPosition } from '@/features/polymarket/types';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { shallowEqual } from '@/worklets/comparisons';

export type PolymarketPositions = {
  positions: PolymarketPosition[];
  activePositions: PolymarketPosition[];
  redeemablePositions: PolymarketPosition[];
  hasPositions: boolean;
};

const EMPTY_POSITIONS: PolymarketPosition[] = [];

const EMPTY_RESULT = Object.freeze<PolymarketPositions>({
  positions: EMPTY_POSITIONS,
  activePositions: EMPTY_POSITIONS,
  redeemablePositions: EMPTY_POSITIONS,
  hasPositions: false,
});

export const usePolymarketPositions = createDerivedStore<PolymarketPositions>(
  $ => {
    const positions = $(usePolymarketPositionsStore, state => state.getPositions() ?? EMPTY_POSITIONS);

    if (!positions.length) return EMPTY_RESULT;

    const activePositions = positions.filter(position => !(position.redeemable && position.currentValue === 0));
    const redeemablePositions = positions.filter(position => position.redeemable);

    return {
      positions,
      activePositions,
      redeemablePositions,
      hasPositions: positions.length > 0,
    };
  },

  { equalityFn: shallowEqual, fastMode: true }
);
