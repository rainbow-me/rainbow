import { usePerpsNavigationStore } from '@/features/perps/screens/PerpsNavigator';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { PerpsPosition } from '@/features/perps/types';
import { VirtualNavigationStore } from '@/navigation/createVirtualNavigator';
import Routes from '@/navigation/routesNames';
import { PerpsRoute } from '@/navigation/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';

export const useHasPositionCheck = createDerivedStore(
  $ => {
    const positions = $(useHyperliquidAccountStore, state => state.getPositions(), didActivePositionsChange);
    const isNewPositionSearchActive = $(usePerpsNavigationStore, checkSearchScreenParams);

    const hasPositions = Object.keys(positions).length > 0;
    if (!hasPositions || !isNewPositionSearchActive) return noPositionsCheck;

    return (symbol: string) => {
      return positions[symbol] !== undefined;
    };
  },

  { fastMode: true }
);

function checkSearchScreenParams(state: VirtualNavigationStore<PerpsRoute>): boolean {
  return state.getParams(Routes.PERPS_SEARCH_SCREEN)?.type === 'newPosition';
}

function didActivePositionsChange(currentPositions: Record<string, PerpsPosition>, prevPositions: Record<string, PerpsPosition>): boolean {
  return (
    Object.keys(currentPositions).length !== Object.keys(prevPositions).length ||
    Object.keys(currentPositions).some(symbol => currentPositions[symbol] !== prevPositions[symbol])
  );
}

function noPositionsCheck(): boolean {
  return false;
}
