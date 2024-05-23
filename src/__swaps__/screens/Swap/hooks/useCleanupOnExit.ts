import { useEffect } from 'react';
import { swapsStore } from '@/state/swaps/swapsStore';
import { userAssetsStore } from '@/state/assets/userAssets';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { useSwapContext } from '../providers/swap-provider';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { INITIAL_SLIDER_POSITION, SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, SLIDER_WIDTH } from '../constants';

export const useCleanupOnExit = () => {
  const {
    setAsset,
    quote,
    isFetching,
    isQuoteStale,
    sliderXPosition,
    sliderPressProgress,
    lastTypedInput,
    focusedInput,
    internalSelectedOutputAsset,
    SwapInputsController,
  } = useSwapContext();

  useEffect(() => {
    return () => {
      const firstUserAsset = userAssetsStore.getState().userAssets.values().next().value;
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: firstUserAsset,
        userAsset: firstUserAsset,
      });

      // reset back to the user's asset with largest balance
      setAsset({
        type: SwapAssetType.inputAsset,
        asset: parsedAsset,
      });

      // reset output asset to null
      internalSelectedOutputAsset.value = null;
      swapsStore.setState({ outputAsset: null });

      // reset input states
      lastTypedInput.value = 'inputAmount';
      focusedInput.value = 'inputAmount';

      // stop quote fetching interval if it was set
      SwapInputsController.quoteFetchingInterval.stop();
      quote.value = null;
      isFetching.value = false;
      isQuoteStale.value = 0;

      // reset inputValues and method
      SwapInputsController.inputMethod.value = 'slider';
      SwapInputsController.inputValues.value.outputAmount = 0;
      SwapInputsController.inputValues.value.outputNativeValue = 0;

      // reset slider position to initial position
      sliderXPosition.value = SLIDER_WIDTH * INITIAL_SLIDER_POSITION;
      sliderPressProgress.value = SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
