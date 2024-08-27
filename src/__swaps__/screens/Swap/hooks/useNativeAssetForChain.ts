import { useCallback } from 'react';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';

import { SharedValue, runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { ParsedAddressAsset } from '@/entities';
import { ethereumUtils } from '@/utils';

export const useNativeAssetForChain = ({ inputAsset }: { inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null> }) => {
  const chainId = useDerivedValue(() => inputAsset.value?.chainId ?? ChainId.mainnet);
  const nativeAsset = useSharedValue<ParsedAddressAsset | undefined>(ethereumUtils.getNetworkNativeAsset(chainId.value));

  const getNativeAssetForNetwork = useCallback(
    (chainId: ChainId) => {
      const asset = ethereumUtils.getNetworkNativeAsset(chainId);
      nativeAsset.value = asset;
    },
    [nativeAsset]
  );

  useAnimatedReaction(
    () => chainId.value,
    (currentChainId, previousChainId) => {
      if (currentChainId !== previousChainId) {
        runOnJS(getNativeAssetForNetwork)(currentChainId);
      }
    },
    []
  );

  return {
    nativeAsset,
  };
};
