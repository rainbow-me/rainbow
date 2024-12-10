import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import {
  useBackendNetworksStore,
  getSwapExactOutputSupportedChainIdsWorklet,
  getBridgeExactOutputSupportedChainIdsWorklet,
} from '@/state/backendNetworks/backendNetworks';

export const useSwapOutputQuotesDisabled = ({
  inputAsset,
  outputAsset,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
}): SharedValue<boolean> => {
  const backendNetworks = useBackendNetworksStore(state => state.backendNetworksSharedValue);

  const outputQuotesAreDisabled = useDerivedValue(() => {
    if (!inputAsset.value || !outputAsset.value) return false;

    if (inputAsset.value.chainId === outputAsset.value.chainId) {
      return !getSwapExactOutputSupportedChainIdsWorklet(backendNetworks).includes(inputAsset.value.chainId);
    } else {
      return !getBridgeExactOutputSupportedChainIdsWorklet(backendNetworks).includes(inputAsset.value.chainId);
    }
  });

  return outputQuotesAreDisabled;
};
