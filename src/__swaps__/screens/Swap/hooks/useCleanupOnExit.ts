import { useEffect } from 'react';
import { useSwapInputsController } from './useSwapInputsController';
import { swapsStore } from '@/state/swaps/swapsStore';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { SharedValue } from 'react-native-reanimated';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { parseAssetAndExtend } from '@/__swaps__/utils/swaps';
import { NavigationSteps } from './useSwapNavigation';
import { useSwapContext } from '../providers/swap-provider';
import { SwapAssetType } from '@/__swaps__/types/swap';

export const useCleanupOnExit = () => {
  const { setAsset, SwapInputsController } = useSwapContext();

  useEffect(() => {
    return () => {
      try {
        // reset back to the user's asset with largest balance
        const firstUserAsset = userAssetsStore.getState().userAssets.values().next().value;
        const parsedAsset = parseSearchAsset({
          assetWithPrice: undefined,
          searchAsset: firstUserAsset,
          userAsset: firstUserAsset,
        });

        setAsset({
          type: SwapAssetType.inputAsset,
          asset: parsedAsset,
        });

        SwapInputsController.quoteFetchingInterval.stop();
      } catch (err) {
        console.log(err);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
