import { useCallback } from 'react';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';

import { SharedValue, runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { ParsedAddressAsset } from '@/entities';
import { ethereumUtils } from '@/utils';
import { swapsStore } from '@/state/swaps/swapsStore';

export const useNativeAssetForChain = ({ inputAsset }: { inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null> }) => {
  const chainId = useDerivedValue(() => inputAsset.value?.chainId ?? swapsStore.getState().preferredNetwork ?? ChainId.mainnet);
  const nativeAsset = useSharedValue<ParsedAddressAsset | undefined>(ethereumUtils.getNetworkNativeAsset({ chainId: chainId.value }));

  const getNativeAssetForNetwork = useCallback(
    (chainId: ChainId) => {
      const asset = ethereumUtils.getNetworkNativeAsset({ chainId });
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
