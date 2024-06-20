import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import { useCallback } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

export const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
  SEARCH_FOCUSED = 2,
  SHOW_GAS = 3,
  SHOW_REVIEW = 4,
}

export function useSwapNavigation({
  executeSwap,
  inputProgress,
  outputProgress,
  configProgress,
  quoteFetchingInterval,
  selectedInputAsset,
  selectedOutputAsset,
}: {
  executeSwap: () => void;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<number>;
  quoteFetchingInterval: ReturnType<typeof useAnimatedInterval>;
  selectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  selectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
}) {
  const navigateBackToReview = useSharedValue(false);

  const handleShowReview = useCallback(() => {
    'worklet';
    if (configProgress.value !== NavigationSteps.SHOW_REVIEW) {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      configProgress.value = NavigationSteps.SHOW_REVIEW;
    }
  }, [inputProgress, outputProgress, configProgress]);

  const handleDismissReview = useCallback(() => {
    'worklet';
    if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
      configProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [configProgress]);

  const handleShowGas = useCallback(
    ({ backToReview = false }: { backToReview?: boolean }) => {
      'worklet';

      if (backToReview) {
        navigateBackToReview.value = true;
      }

      if (configProgress.value !== NavigationSteps.SHOW_GAS) {
        inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
        outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
        configProgress.value = NavigationSteps.SHOW_GAS;
      }
    },
    [configProgress, navigateBackToReview, inputProgress, outputProgress]
  );

  const handleDismissGas = useCallback(() => {
    'worklet';

    if (configProgress.value === NavigationSteps.SHOW_GAS) {
      configProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [configProgress]);

  const handleExitSearch = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();

    const isInputAssetNull = selectedInputAsset.value === null;
    const isOutputAssetNull = selectedOutputAsset.value === null;
    const areBothAssetsSelected = !isInputAssetNull && !isOutputAssetNull;

    if (inputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED && !isInputAssetNull) {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      if (areBothAssetsSelected) {
        quoteFetchingInterval.start();
      } else {
        outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
        return;
      }
    } else if (inputProgress.value === NavigationSteps.SEARCH_FOCUSED) {
      inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
    }

    if (outputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED && !isOutputAssetNull) {
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      if (areBothAssetsSelected) {
        quoteFetchingInterval.start();
      } else {
        inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
        return;
      }
    } else if (outputProgress.value === NavigationSteps.SEARCH_FOCUSED) {
      outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
    }
  }, [
    handleDismissGas,
    handleDismissReview,
    inputProgress,
    outputProgress,
    quoteFetchingInterval,
    selectedInputAsset,
    selectedOutputAsset,
  ]);

  const handleFocusInputSearch = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();

    if (inputProgress.value !== NavigationSteps.SEARCH_FOCUSED) {
      inputProgress.value = NavigationSteps.SEARCH_FOCUSED;
    }
  }, [handleDismissReview, handleDismissGas, inputProgress]);

  const handleFocusOutputSearch = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();

    if (outputProgress.value !== NavigationSteps.SEARCH_FOCUSED) {
      outputProgress.value = NavigationSteps.SEARCH_FOCUSED;
    }
  }, [handleDismissReview, handleDismissGas, outputProgress]);

  const handleInputPress = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();
    quoteFetchingInterval.pause();

    if (inputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED) {
      inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    } else {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [handleDismissReview, handleDismissGas, inputProgress, outputProgress, quoteFetchingInterval]);

  const handleOutputPress = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();
    quoteFetchingInterval.pause();

    if (outputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED) {
      outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    } else {
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [handleDismissReview, handleDismissGas, inputProgress, outputProgress, quoteFetchingInterval]);

  const handleSwapAction = useCallback(() => {
    'worklet';

    if (configProgress.value === NavigationSteps.SHOW_GAS) {
      if (navigateBackToReview.value) {
        navigateBackToReview.value = false;
        handleShowReview();
      } else {
        handleDismissGas();
      }
    } else if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
      // TODO: Handle long press
      executeSwap();
    } else {
      handleShowReview();
    }
  }, [configProgress, executeSwap, handleDismissGas, handleShowReview, navigateBackToReview]);

  return {
    navigateBackToReview,
    handleExitSearch,
    handleFocusInputSearch,
    handleFocusOutputSearch,
    handleInputPress,
    handleOutputPress,
    handleShowReview,
    handleDismissReview,
    handleShowGas,
    handleDismissGas,
    handleSwapAction,
  };
}
