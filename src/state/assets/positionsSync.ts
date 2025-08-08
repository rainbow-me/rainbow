import { usePositionsStore } from '@/state/positions/positions';
import { userAssetsStore } from './userAssets';

let unsubscribe: (() => void) | null = null;

/**
 * Sets up a subscription to the positions store to reprocess assets
 * when positions data changes.
 */
export function setupPositionsAssetsSync() {
  cleanupPositionsAssetsSync();

  unsubscribe = usePositionsStore.subscribe(
    state => state.getData(),
    positionsData => {
      if (positionsData) {
        userAssetsStore.getState().reprocessAssetsData();
      }
    }
  );
}

export function cleanupPositionsAssetsSync() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
