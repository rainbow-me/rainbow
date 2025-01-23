import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const useSwapOutputQuotesDisabled = ({
  inputAsset,
  outputAsset,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
}): SharedValue<boolean> => {
  const swapSupportedChainIds = useBackendNetworksStore(state => state.getSwapExactOutputSupportedChainIds());
  const bridgeSupportedChainIds = useBackendNetworksStore(state => state.getBridgeExactOutputSupportedChainIds());

  const outputQuotesAreDisabled = useDerivedValue(() => {
    if (!inputAsset.value || !outputAsset.value) return false;

    if (inputAsset.value.chainId === outputAsset.value.chainId) {
      return !swapSupportedChainIds.includes(inputAsset.value.chainId);
    } else {
      return !bridgeSupportedChainIds.includes(inputAsset.value.chainId);
    }
  });

  return outputQuotesAreDisabled;
};
