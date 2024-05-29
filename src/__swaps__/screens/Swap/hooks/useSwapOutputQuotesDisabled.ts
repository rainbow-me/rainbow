import { SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

export const useSwapOutputQuotesDisabled = ({
  inputAsset,
  outputAsset,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
}) => {
  const outputQuotesAreDisabled = useSharedValue(false);

  useAnimatedReaction(
    () => ({
      inputChainId: inputAsset?.value?.chainId,
      outputChainId: outputAsset?.value?.chainId,
    }),
    current => {
      if (current.inputChainId && current.outputChainId) {
        outputQuotesAreDisabled.value = current.inputChainId !== current.outputChainId;
      }
    }
  );

  return outputQuotesAreDisabled;
};
