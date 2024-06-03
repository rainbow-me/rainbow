import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

export const useSwapOutputQuotesDisabled = ({
  inputAsset,
  outputAsset,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
}) => {
  const outputQuotesAreDisabled = useDerivedValue(() => {
    const bothAssetsSelected = !!inputAsset.value && !!outputAsset.value;
    if (!bothAssetsSelected) return false;

    return inputAsset.value?.chainId !== outputAsset.value?.chainId;
  });

  return outputQuotesAreDisabled;
};
