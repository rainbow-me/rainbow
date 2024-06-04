import { useCallback } from 'react';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';

import { SharedValue, runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { ParsedAddressAsset } from '@/entities';
import { ethereumUtils } from '@/utils';

export const useNativeAssetForChain = ({ inputAsset }: { inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null> }) => {
  const chainId = useDerivedValue(() => inputAsset.value?.chainId ?? ChainId.mainnet);
  const nativeAsset = useSharedValue<ParsedAddressAsset | undefined>(
    ethereumUtils.getNetworkNativeAsset(ethereumUtils.getNetworkFromChainId(chainId.value))
  );

  const getNativeAssetForNetwork = useCallback(
    (chainId: ChainId) => {
      const network = ethereumUtils.getNetworkFromChainId(chainId);
      const asset = ethereumUtils.getNetworkNativeAsset(network);
      nativeAsset.value = asset;
    },
    [nativeAsset]
  );

  useAnimatedReaction(
    () => chainId.value,
    (currentChainId, previoudChainId) => {
      if (currentChainId !== previoudChainId) {
        runOnJS(getNativeAssetForNetwork)(currentChainId);
      }
    }
  );

  return {
    nativeAsset,
  };
};
