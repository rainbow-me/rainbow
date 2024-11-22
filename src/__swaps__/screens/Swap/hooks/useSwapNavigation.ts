import { useCallback } from 'react';
import { DerivedValue, SharedValue, useSharedValue } from 'react-native-reanimated';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import Routes from '@/navigation/Routes';
import { navigate } from '@/navigation/Navigation';

export const enum NavigationSteps {
  INPUT_ELEMENT_FOCUSED = 0,
  TOKEN_LIST_FOCUSED = 1,
  SEARCH_FOCUSED = 2,
  SHOW_GAS = 3,
  SHOW_REVIEW = 4,
  SHOW_SETTINGS = 5,
}

export function useSwapNavigation({
  configProgress,
  executeSwap,
  inputProgress,
  isDegenMode,
  outputProgress,
  quoteFetchingInterval,
  selectedInputAsset,
  selectedOutputAsset,
  swapInfo,
}: {
  configProgress: SharedValue<number>;
  executeSwap: () => void;
  inputProgress: SharedValue<number>;
  isDegenMode: SharedValue<boolean>;
  outputProgress: SharedValue<number>;
  quoteFetchingInterval: ReturnType<typeof useAnimatedInterval>;
  selectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  selectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  swapInfo: DerivedValue<{ areBothAssetsSet: boolean; isBridging: boolean }>;
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

  const handleShowSettings = useCallback(() => {
    'worklet';
    if (configProgress.value !== NavigationSteps.SHOW_SETTINGS) {
      if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
        navigateBackToReview.value = true;
      }
      if (swapInfo.value.areBothAssetsSet) {
        quoteFetchingInterval.pause();
      }

      if (inputProgress.value > NavigationSteps.INPUT_ELEMENT_FOCUSED) {
        inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      }
      if (outputProgress.value > NavigationSteps.INPUT_ELEMENT_FOCUSED) {
        outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      }

      configProgress.value = NavigationSteps.SHOW_SETTINGS;
    }
  }, [configProgress, inputProgress, navigateBackToReview, outputProgress, quoteFetchingInterval, swapInfo]);

  const handleDismissReview = useCallback(() => {
    'worklet';
    if (configProgress.value === NavigationSteps.SHOW_REVIEW) {
      configProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [configProgress]);

  const handleDismissSettings = useCallback(
    ({ skipAssetChecks = false } = {}) => {
      'worklet';

      if (configProgress.value === NavigationSteps.SHOW_SETTINGS) {
        configProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;

        if (swapInfo.value.areBothAssetsSet) {
          quoteFetchingInterval.start();
        }

        if (!skipAssetChecks) {
          if (!selectedInputAsset.value) inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
          if (!selectedOutputAsset.value) outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
        }
      }
    },
    [configProgress, inputProgress, outputProgress, quoteFetchingInterval, selectedInputAsset, selectedOutputAsset, swapInfo]
  );

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
    handleDismissSettings({ skipAssetChecks: true });

    const isInputAssetNull = selectedInputAsset.value === null;
    const isOutputAssetNull = selectedOutputAsset.value === null;

    if (inputProgress.value === NavigationSteps.TOKEN_LIST_FOCUSED && !isInputAssetNull) {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
      if (swapInfo.value.areBothAssetsSet) {
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
      if (swapInfo.value.areBothAssetsSet) {
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
    handleDismissSettings,
    inputProgress,
    outputProgress,
    quoteFetchingInterval,
    selectedInputAsset,
    selectedOutputAsset,
    swapInfo,
  ]);

  const handleFocusInputSearch = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();
    handleDismissSettings({ skipAssetChecks: true });

    if (inputProgress.value !== NavigationSteps.SEARCH_FOCUSED) {
      inputProgress.value = NavigationSteps.SEARCH_FOCUSED;
    }
  }, [handleDismissGas, handleDismissReview, handleDismissSettings, inputProgress]);

  const handleFocusOutputSearch = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();
    handleDismissSettings({ skipAssetChecks: true });

    if (outputProgress.value !== NavigationSteps.SEARCH_FOCUSED) {
      outputProgress.value = NavigationSteps.SEARCH_FOCUSED;
    }
  }, [handleDismissGas, handleDismissReview, handleDismissSettings, outputProgress]);

  const handleInputPress = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();
    handleDismissSettings({ skipAssetChecks: true });
    quoteFetchingInterval.pause();

    if (inputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED) {
      inputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    } else {
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [handleDismissReview, handleDismissGas, handleDismissSettings, inputProgress, outputProgress, quoteFetchingInterval]);

  const handleOutputPress = useCallback(() => {
    'worklet';
    handleDismissReview();
    handleDismissGas();
    handleDismissSettings({ skipAssetChecks: true });
    quoteFetchingInterval.pause();

    if (outputProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED) {
      outputProgress.value = NavigationSteps.TOKEN_LIST_FOCUSED;
      inputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    } else {
      outputProgress.value = NavigationSteps.INPUT_ELEMENT_FOCUSED;
    }
  }, [handleDismissReview, handleDismissGas, handleDismissSettings, inputProgress, outputProgress, quoteFetchingInterval]);

  const handleSwapAction = useCallback(
    (isHardwareWallet: boolean) => {
      'worklet';

      if (configProgress.value === NavigationSteps.SHOW_GAS) {
        if (navigateBackToReview.value) {
          navigateBackToReview.value = false;
          return handleShowReview();
        }

        return handleDismissGas();
      }

      if (configProgress.value === NavigationSteps.SHOW_SETTINGS) {
        if (navigateBackToReview.value && !isDegenMode.value) {
          navigateBackToReview.value = false;
          return handleShowReview();
        }

        return handleDismissSettings();
      }

      if (isDegenMode.value || configProgress.value === NavigationSteps.SHOW_REVIEW) {
        if (isHardwareWallet) {
          navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: executeSwap });
          return;
        } else {
          return executeSwap();
        }
      }

      return handleShowReview();
    },
    [configProgress, executeSwap, handleDismissGas, handleDismissSettings, handleShowReview, isDegenMode, navigateBackToReview]
  );

  return {
    navigateBackToReview,
    handleExitSearch,
    handleFocusInputSearch,
    handleFocusOutputSearch,
    handleInputPress,
    handleOutputPress,
    handleShowReview,
    handleShowSettings,
    handleDismissReview,
    handleDismissSettings,
    handleShowGas,
    handleDismissGas,
    handleSwapAction,
  };
}
