import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { supportedSwapExactOutputChainIds, supportedBridgeExactOutputChainIds } from '@/chains';

export const useSwapOutputQuotesDisabled = ({
  inputAsset,
  outputAsset,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
}): SharedValue<boolean> => {
  const outputQuotesAreDisabled = useDerivedValue(() => {
    if (!inputAsset.value || !outputAsset.value) return false;

    if (inputAsset.value.chainId === outputAsset.value.chainId) {
      return !supportedSwapExactOutputChainIds.includes(inputAsset.value.chainId);
    } else {
      return !supportedBridgeExactOutputChainIds.includes(inputAsset.value.chainId);
    }
  });

  return outputQuotesAreDisabled;
};
