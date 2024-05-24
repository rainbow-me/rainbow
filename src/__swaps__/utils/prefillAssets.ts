import { userAssetsStore } from '@/state/assets/userAssets';
import { UniqueId } from '../types/assets';
import { useSwapContext } from '../screens/Swap/providers/swap-provider';

export enum EntryPoint {
  ProfileActionButtonsRow = 'ProfileActionButtonsRow',
  AssetChart = 'AssetChart',
}

export type EntryPointData = {
  inputAssetUniqueId?: UniqueId;
  outputAssetUniqueId?: UniqueId;

  // amounts
  percentageOfInputAssetToSell?: number;
  percentageOfOutputAssetToBuy?: number;
  amountOfInputAssetToSell?: number;
  amountOfOutputAssetToBuy?: number;
};

export const usePrefillAssets = (entryPoint: EntryPoint, data?: EntryPointData) => {
  const { internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  // NOTE: User assets are sorted by balance in descending order.
  const userAssets = userAssetsStore.getState().userAssets;

  switch (entryPoint) {
    /**
     * If we're coming to the swap screen from the profile action buttons row, we need to prefill the inputAsset
     * to the user asset with the largest balance. We should also open the output token list so that they can
     * select an output asset.
     */
    default:
    case EntryPoint.ProfileActionButtonsRow:
      break;

    /**
     * If we're coming to the swap screen from an asset chart, we need to
     */
    case EntryPoint.AssetChart:
      break;
  }
};
