import { SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { isChainDisabledForOutputQuotes } from '@/__swaps__/utils/swaps';

export const useSwapOutputQuotesDisabled = ({ inputAsset }: { inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null> }) => {
  const outputQuotesAreDisabled = useSharedValue(false);

  useAnimatedReaction(
    () => inputAsset.value,
    (current, previous) => {
      if (current && current !== previous) {
        outputQuotesAreDisabled.value = isChainDisabledForOutputQuotes(current.chainId);
      }
    }
  );

  return outputQuotesAreDisabled;
};
