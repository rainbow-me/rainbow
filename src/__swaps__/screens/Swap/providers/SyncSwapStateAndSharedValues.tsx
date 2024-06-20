import {
  divWorklet,
  greaterThanWorklet,
  lessThanOrEqualToWorklet,
  lessThanWorklet,
  mulWorklet,
  powWorklet,
  subWorklet,
  toFixedWorklet,
  toScaledIntegerWorklet,
} from '@/__swaps__/safe-math/SafeMath';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { add } from '@/__swaps__/utils/numbers';
import { ParsedAddressAsset } from '@/entities';
import { useUserNativeNetworkAsset } from '@/resources/assets/useUserAsset';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { debounce } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { SharedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { formatUnits } from 'viem';
import { create } from 'zustand';
import { calculateGasFee } from '../hooks/useEstimatedGasFee';
import { useSelectedGas } from '../hooks/useSelectedGas';
import { useSwapEstimatedGasLimit } from '../hooks/useSwapEstimatedGasLimit';
import { useSwapContext } from './swap-provider';

const LOWER_BOUND_FACTOR = 0.75;
const UPPER_BOUND_FACTOR = 1.25;

type InternalSyncedSwapState = {
  assetToBuy: ExtendedAnimatedAssetWithColors | undefined;
  assetToSell: ExtendedAnimatedAssetWithColors | undefined;
  chainId: ChainId | undefined;
  quote: Quote | CrosschainQuote | QuoteError | null;
};
export const useSyncedSwapQuoteStore = create<InternalSyncedSwapState>(() => ({
  assetToBuy: undefined,
  assetToSell: undefined,
  chainId: undefined,
  quote: null,
}));
const setInternalSyncedSwapStore = debounce((state: InternalSyncedSwapState) => useSyncedSwapQuoteStore.setState(state), 100, {
  leading: false,
  trailing: true,
});

export const SyncQuoteSharedValuesToState = () => {
  const { internalSelectedInputAsset: assetToSell, internalSelectedOutputAsset: assetToBuy, quote } = useSwapContext();

  // Updates the state as a single block in response to quote changes to ensure the gas fee is cleanly updated once
  useAnimatedReaction(
    () => quote.value,
    (current, previous) => {
      if (!assetToSell.value || !assetToBuy.value || !current || 'error' in current) return;

      const isSwappingMoreThanAvailableBalance = greaterThanWorklet(
        current.sellAmount.toString(),
        toScaledIntegerWorklet(assetToSell.value.balance.amount, assetToSell.value.decimals)
      );

      // Skip gas fee recalculation if the user is trying to swap more than their available balance, as it isn't
      // needed and was previously resulting in errors in useEstimatedGasFee.
      if (isSwappingMoreThanAvailableBalance) return;

      if (!previous || current !== previous) {
        runOnJS(setInternalSyncedSwapStore)({
          assetToBuy: assetToBuy.value,
          assetToSell: assetToSell.value,
          chainId: assetToSell.value?.chainId,
          quote: current,
        });
      }
    }
  );

  return null;
};

const getHasEnoughFundsForGas = (quote: Quote, gasFee: string, nativeNetworkAsset: ParsedAddressAsset | undefined) => {
  if (!nativeNetworkAsset) return false;
  const userBalance = nativeNetworkAsset.balance?.amount || '0';

  const quoteValue = quote.value?.toString() || '0';
  const totalNativeSpentInTx = formatUnits(BigInt(add(quoteValue, gasFee)), nativeNetworkAsset.decimals);

  return lessThanOrEqualToWorklet(totalNativeSpentInTx, userBalance);
};

const BUFFER_FACTOR = 1.3;
function updateMaxSwappableAmount(internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>, gasFee: string) {
  internalSelectedInputAsset.modify(asset => {
    'worklet';

    if (!asset?.isNativeAsset) return asset;

    const gasFeeNativeCurrency = divWorklet(gasFee, powWorklet(10, asset.decimals));
    const gasFeeWithBuffer = toFixedWorklet(mulWorklet(gasFeeNativeCurrency, BUFFER_FACTOR), asset.decimals);
    const maxSwappableAmount = subWorklet(asset.balance.amount, gasFeeWithBuffer);

    return {
      ...asset,
      maxSwappableAmount: lessThanWorklet(maxSwappableAmount, 0) ? '0' : maxSwappableAmount,
    };
  });
}

export function SyncGasStateToSharedValues() {
  const { hasEnoughFundsForGas, internalSelectedInputAsset } = useSwapContext();

  const { assetToSell, chainId = ChainId.mainnet, quote } = useSyncedSwapQuoteStore();

  const gasSettings = useSelectedGas(chainId);
  const { data: userNativeNetworkAsset } = useUserNativeNetworkAsset(chainId);
  const { data: estimatedGasLimit } = useSwapEstimatedGasLimit({ chainId, assetToSell, quote });

  const gasFeeRange = useRef<[string, string] | null>(null);

  // reset gas fee range when input chain changes
  useEffect(() => {
    gasFeeRange.current = null;
  }, [chainId]);

  useEffect(() => {
    hasEnoughFundsForGas.value = undefined;
    if (!gasSettings || !estimatedGasLimit || !quote || 'error' in quote || !assetToSell) return;

    const gasFee = calculateGasFee(gasSettings, estimatedGasLimit);

    const nativeGasFee = divWorklet(gasFee, powWorklet(10, assetToSell.decimals));

    const isEstimateOutsideRange =
      gasFeeRange.current &&
      (lessThanWorklet(nativeGasFee, gasFeeRange.current[0]) || greaterThanWorklet(nativeGasFee, gasFeeRange.current[1]));

    // If the gas fee range hasn't been set or the estimated fee is outside the range, calculate the range based on the gas fee
    if (nativeGasFee && (!gasFeeRange || isEstimateOutsideRange)) {
      const lowerBound = toFixedWorklet(mulWorklet(nativeGasFee, LOWER_BOUND_FACTOR), assetToSell.decimals);
      const upperBound = toFixedWorklet(mulWorklet(nativeGasFee, UPPER_BOUND_FACTOR), assetToSell.decimals);
      gasFeeRange.current = [lowerBound, upperBound];

      // update maxSwappableAmount for input asset if it's the native asset
      if (assetToSell.isNativeAsset) {
        internalSelectedInputAsset.modify(asset => {
          'worklet';
          if (!asset) return asset;
          return {
            ...asset,
            maxSwappableAmount: subWorklet(asset.balance.amount, upperBound),
          };
        });
      }
    }

    hasEnoughFundsForGas.value = getHasEnoughFundsForGas(quote, gasFee, userNativeNetworkAsset);

    return () => {
      hasEnoughFundsForGas.value = undefined;
    };
  }, [assetToSell, estimatedGasLimit, gasSettings, hasEnoughFundsForGas, internalSelectedInputAsset, quote, userNativeNetworkAsset]);

  return null;
}
