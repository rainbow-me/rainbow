import { createDerivedStore } from '@storesjs/stores';

import { EditAction } from '@/helpers/EditAction';
import { userAssetsActions, useUserAssetsStore } from '@/state/assets/userAssets';

import { pinnedCoinsActions, useCurrentPinnedCoins } from './pinnedCoinsStore';
import { selectedCoinsActions, useSelectedCoinsStore } from './selectedCoinsStore';

export const useCoinEditingStore = createDerivedStore(
  $ => {
    const selectedItems = $(useSelectedCoinsStore, state => state.selectedItems);
    const hiddenAssets = $(useUserAssetsStore, state => state.hiddenAssets);
    const pinnedCoins = $(useCurrentPinnedCoins, s => s);

    const currentAction = !selectedItems.length
      ? EditAction.none
      : selectedItems.every(id => hiddenAssets.has(id))
        ? EditAction.unhide
        : selectedItems.every(id => pinnedCoins[id])
          ? EditAction.unpin
          : EditAction.standard;

    return { currentAction, selectedItems, setHiddenCoins, setPinnedCoins };
  },
  { lockDependencies: true }
);

function setPinnedCoins(): void {
  const { currentAction, selectedItems } = useCoinEditingStore.getState();
  if (currentAction === EditAction.unpin || currentAction === EditAction.standard) {
    pinnedCoinsActions.setPinnedCoins(selectedItems, currentAction === EditAction.standard);
  }

  selectedCoinsActions.clearSelectedCoins();
}

function setHiddenCoins(): void {
  const { currentAction, selectedItems } = useCoinEditingStore.getState();
  if (currentAction === EditAction.none || currentAction === EditAction.unpin) return;
  userAssetsActions.setHiddenAssets(selectedItems);
  selectedCoinsActions.clearSelectedCoins();
}
