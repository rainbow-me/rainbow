import { useCallback } from 'react';
import { SharedValue } from 'react-native-reanimated';

export function useSwapNavigation({
  inputProgress,
  outputProgress,
}: {
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
}) {
  // TODO: This can all be simplified
  const handleExitSearch = useCallback(() => {
    'worklet';
    if (inputProgress.value === 1) {
      inputProgress.value = 0;
    }
    if (outputProgress.value === 1) {
      outputProgress.value = 0;
    }
    if (inputProgress.value === 2) {
      inputProgress.value = 1;
    }
    if (outputProgress.value === 2) {
      outputProgress.value = 1;
    }
  }, [inputProgress, outputProgress]);

  const handleFocusInputSearch = useCallback(() => {
    'worklet';
    if (inputProgress.value !== 2) {
      inputProgress.value = 2;
    }
  }, [inputProgress]);

  const handleFocusOutputSearch = useCallback(() => {
    'worklet';
    if (outputProgress.value !== 2) {
      outputProgress.value = 2;
    }
  }, [outputProgress]);

  const handleInputPress = useCallback(() => {
    'worklet';
    if (inputProgress.value === 0) {
      inputProgress.value = 1;
      outputProgress.value = 0;
    } else {
      inputProgress.value = 0;
    }
  }, [inputProgress, outputProgress]);

  const handleOutputPress = useCallback(() => {
    'worklet';
    if (outputProgress.value === 0) {
      outputProgress.value = 1;
      inputProgress.value = 0;
    } else {
      outputProgress.value = 0;
    }
  }, [inputProgress, outputProgress]);

  return {
    handleExitSearch,
    handleFocusInputSearch,
    handleFocusOutputSearch,
    handleInputPress,
    handleOutputPress,
  };
}
