import { createDerivedStore } from '@storesjs/stores';

import { EditAction } from '@/helpers/EditAction';
import { userAssetsActions, useUserAssetsStore } from '@/state/assets/userAssets';

import { pinnedCoinsActions, useCurrentPinnedCoins } from './pinnedCoinsStore';
import { selectedCoinsActions, useSelectedCoinsStore } from './selectedCoinsStore';

export const useCoinEditingStore = createDerivedStore($ => {
  const selectedItems = $(useSelectedCoinsStore, state => state.selectedItems);
  const hiddenAssets = $(useUserAssetsStore, state => state.hiddenAssets);
  const pinnedCoins = $(useCurrentPinnedCoins);

  const currentAction = !selectedItems.length
    ? EditAction.none
    : selectedItems.every(id => hiddenAssets.has(id))
      ? EditAction.unhide
      : selectedItems.every(id => pinnedCoins[id])
        ? EditAction.unpin
        : EditAction.standard;

  return { currentAction, selectedItems, setHiddenCoins, setPinnedCoins };
});

function setPinnedCoins(): void {
  const { currentAction, selectedItems } = useCoinEditingStore.getState();
  const pinnedCoins = { ...useCurrentPinnedCoins.getState() };
  if (currentAction === EditAction.unpin) {
    for (const id of selectedItems) delete pinnedCoins[id];
  } else if (currentAction === EditAction.standard) {
    for (const id of selectedItems) pinnedCoins[id] = true;
  }
  pinnedCoinsActions.setPinnedCoins(pinnedCoins);
  selectedCoinsActions.clearSelectedCoins();
}

function setHiddenCoins(): void {
  const { currentAction, selectedItems } = useCoinEditingStore.getState();
  if (currentAction === EditAction.none || currentAction === EditAction.unpin) return;
  userAssetsActions.setHiddenAssets(selectedItems);
  selectedCoinsActions.clearSelectedCoins();
}
