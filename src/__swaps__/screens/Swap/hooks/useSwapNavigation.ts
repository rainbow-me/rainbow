import { useCallback } from 'react';
import { SharedValue, useSharedValue } from 'react-native-reanimated';
import { useSwapInputsController } from './useSwapInputsController';

export const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
  SEARCH_FOCUSED = 2,
  SHOW_GAS = 3,
  SHOW_REVIEW = 4,
}

export function useSwapNavigation({
  SwapInputsController,
  inputProgress,
  outputProgress,
  configProgress,
}: {
  SwapInputsController: ReturnType<typeof useSwapInputsController>;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  configProgress: SharedValue<number>;
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
    SwapInputsController.fetchQuoteAndAssetPrices();

    if (inputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED) {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
    if (outputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED) {
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
    if (inputProgress.value === NavigationSteps.SEARCH_FOCUSED) {
      inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
    }
    if (outputProgress.value === NavigationSteps.SEARCH_FOCUSED) {
      outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
    }
  }, [SwapInputsController, handleDismissGas, handleDismissReview, inputProgress, outputProgress]);

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
    SwapInputsController.quoteFetchingInterval.stop();

    if (inputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED) {
      console.log('showing token list');
      inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    } else {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [handleDismissReview, handleDismissGas, inputProgress, outputProgress, SwapInputsController]);

  const handleOutputPress = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();
    SwapInputsController.quoteFetchingInterval.stop();

    if (outputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED) {
      outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    } else {
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [SwapInputsController, handleDismissReview, handleDismissGas, inputProgress, outputProgress]);

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
      // TODO: Handle executing swap
      handleDismissReview();
    } else {
      handleShowReview();
    }
  }, [configProgress, handleDismissGas, handleDismissReview, handleShowReview, navigateBackToReview]);

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
