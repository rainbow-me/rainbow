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
import { useEffect } from 'react';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { formatUnits } from 'viem';
import { create } from 'zustand';
import { calculateGasFee } from '../hooks/useEstimatedGasFee';
import { useSelectedGas } from '../hooks/useSelectedGas';
import { useSwapEstimatedGasLimit } from '../hooks/useSwapEstimatedGasLimit';
import { useSwapContext } from './swap-provider';

const BUFFER_RATIO = 0.5;

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

export function SyncGasStateToSharedValues() {
  const { hasEnoughFundsForGas, internalSelectedInputAsset } = useSwapContext();

  const { assetToSell, chainId = ChainId.mainnet, quote } = useSyncedSwapQuoteStore();

  const gasSettings = useSelectedGas(chainId);
  const { data: userNativeNetworkAsset } = useUserNativeNetworkAsset(chainId);
  const { data: estimatedGasLimit } = useSwapEstimatedGasLimit({ chainId, assetToSell, quote });

  const gasFeeRange = useSharedValue<[string, string] | null>(null);

  useAnimatedReaction(
    () => ({ inputAsset: internalSelectedInputAsset.value, bufferRange: gasFeeRange.value }),
    (current, previous) => {
      const { inputAsset: currInputAsset, bufferRange: currBufferRange } = current;
      const { inputAsset: prevInputAsset, bufferRange: prevBufferRange } = previous || {};

      const currBuffer = currBufferRange?.[1];
      const prevBuffer = prevBufferRange?.[1];

      if (currInputAsset?.chainId !== prevInputAsset?.chainId) {
        // reset gas fee range when input chain changes
        gasFeeRange.value = null;
      } else if (currBuffer && (currBuffer !== prevBuffer || currInputAsset?.uniqueId !== prevInputAsset?.uniqueId)) {
        // update maxSwappableAmount when gas fee range is set and there is a change to input asset or gas fee range
        if (currInputAsset?.isNativeAsset) {
          internalSelectedInputAsset.modify(asset => {
            if (!asset) return asset;
            return {
              ...asset,
              maxSwappableAmount: subWorklet(asset.balance.amount, currBuffer),
            };
          });
        }
      }
    }
  );

  useEffect(() => {
    hasEnoughFundsForGas.value = undefined;
    if (!gasSettings || !estimatedGasLimit || !quote || 'error' in quote || !userNativeNetworkAsset) return;

    const gasFee = calculateGasFee(gasSettings, estimatedGasLimit);

    const nativeGasFee = divWorklet(gasFee, powWorklet(10, userNativeNetworkAsset.decimals));

    const isEstimateOutsideRange = !!(
      gasFeeRange.value &&
      (lessThanWorklet(nativeGasFee, gasFeeRange.value[0]) || greaterThanWorklet(nativeGasFee, gasFeeRange.value[1]))
    );

    // If the gas fee range hasn't been set or the estimated fee is outside the range, calculate the range based on the gas fee
    if (nativeGasFee && (!gasFeeRange.value || isEstimateOutsideRange)) {
      const lowerBound = toFixedWorklet(mulWorklet(nativeGasFee, 1 - BUFFER_RATIO), userNativeNetworkAsset.decimals);
      const upperBound = toFixedWorklet(mulWorklet(nativeGasFee, 1 + BUFFER_RATIO), userNativeNetworkAsset.decimals);
      gasFeeRange.value = [lowerBound, upperBound];
    }

    hasEnoughFundsForGas.value = getHasEnoughFundsForGas(quote, gasFee, userNativeNetworkAsset);

    return () => {
      hasEnoughFundsForGas.value = undefined;
    };
  }, [estimatedGasLimit, gasFeeRange, gasSettings, hasEnoughFundsForGas, quote, userNativeNetworkAsset]);

  return null;
}
