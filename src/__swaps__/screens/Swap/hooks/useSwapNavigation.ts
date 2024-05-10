import { useCallback } from 'react';
import { SharedValue } from 'react-native-reanimated';
import { useSwapInputsController } from './useSwapInputsController';

export const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
  SEARCH_FOCUSED = 2,
  SHOW_GAS = 3,
  SHOW_REVIEW = 4,
}

export function useSwapNavigation({
  SwapInputController,
  inputProgress,
  outputProgress,
  reviewProgress,
}: {
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  reviewProgress: SharedValue<number>;
}) {
  const handleShowReview = useCallback(() => {
    'worklet';
    if (reviewProgress.value !== NavigationSteps.SHOW_REVIEW) {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      reviewProgress.value = NavigationSteps.SHOW_REVIEW;
    }
  }, [inputProgress, outputProgress, reviewProgress]);

  const handleDismissReview = useCallback(() => {
    'worklet';
    if (reviewProgress.value === NavigationSteps.SHOW_REVIEW) {
      reviewProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [reviewProgress]);

  const handleExitSearch = useCallback(() => {
    'worklet';
    handleDismissReview();

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
  }, [handleDismissReview, inputProgress, outputProgress]);

  const handleFocusInputSearch = useCallback(() => {
    'worklet';
    handleDismissReview();

    if (inputProgress.value !== NavigationSteps.SEARCH_FOCUSED) {
      inputProgress.value = NavigationSteps.SEARCH_FOCUSED;
    }
  }, [handleDismissReview, inputProgress]);

  const handleFocusOutputSearch = useCallback(() => {
    'worklet';
    handleDismissReview();

    if (outputProgress.value !== NavigationSteps.SEARCH_FOCUSED) {
      outputProgress.value = NavigationSteps.SEARCH_FOCUSED;
    }
  }, [handleDismissReview, outputProgress]);

  const handleInputPress = useCallback(() => {
    'worklet';
    handleDismissReview();

    if (inputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED) {
      inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      SwapInputController.quoteFetchingInterval.stop();
    } else {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      SwapInputController.fetchQuote();
      SwapInputController.quoteFetchingInterval.start();
    }
  }, [handleDismissReview, inputProgress, outputProgress, SwapInputController]);

  const handleOutputPress = useCallback(() => {
    'worklet';
    handleDismissReview();

    if (outputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED) {
      outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      SwapInputController.quoteFetchingInterval.stop();
    } else {
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      SwapInputController.fetchQuote();
      SwapInputController.quoteFetchingInterval.start();
    }
  }, [handleDismissReview, inputProgress, outputProgress, SwapInputController]);

  return {
    handleExitSearch,
    handleFocusInputSearch,
    handleFocusOutputSearch,
    handleInputPress,
    handleOutputPress,
    handleShowReview,
    handleDismissReview,
  };
}
