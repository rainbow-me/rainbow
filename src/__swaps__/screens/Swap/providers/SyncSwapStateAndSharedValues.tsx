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
import { useEffect, useRef } from 'react';
import { SharedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { formatUnits } from 'viem';
import { create } from 'zustand';
import { calculateGasFee } from '../hooks/useEstimatedGasFee';
import { useSelectedGas } from '../hooks/useSelectedGas';
import { useSwapEstimatedGasLimit } from '../hooks/useSwapEstimatedGasLimit';
import { useSwapContext } from './swap-provider';

const BUFFER_RATIO = 0.25;

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

function updateMaxSwappableAmount(inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>, buffer: string) {
  inputAsset.modify(asset => {
    'worklet';
    if (!asset) return asset;
    return {
      ...asset,
      maxSwappableAmount: subWorklet(asset.balance.amount, buffer),
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

  // when input asset changes, update maxSwappableAmount if it's the native asset
  useEffect(() => {
    const buffer = gasFeeRange.current?.[1];
    if (buffer && assetToSell?.isNativeAsset) {
      updateMaxSwappableAmount(internalSelectedInputAsset, buffer);
    }
  }, [assetToSell?.isNativeAsset, internalSelectedInputAsset]);

  useEffect(() => {
    hasEnoughFundsForGas.value = undefined;
    if (!gasSettings || !estimatedGasLimit || !quote || 'error' in quote || !assetToSell) return;

    const gasFee = calculateGasFee(gasSettings, estimatedGasLimit);

    const nativeGasFee = divWorklet(gasFee, powWorklet(10, assetToSell.decimals));

    const isEstimateOutsideRange =
      gasFeeRange.current &&
      (lessThanWorklet(nativeGasFee, gasFeeRange.current[0]) || greaterThanWorklet(nativeGasFee, gasFeeRange.current[1]));

    // If the gas fee range hasn't been set or the estimated fee is outside the range, calculate the range based on the gas fee
    if (nativeGasFee && (!gasFeeRange.current || isEstimateOutsideRange)) {
      const lowerBound = toFixedWorklet(mulWorklet(nativeGasFee, 1 - BUFFER_RATIO), assetToSell.decimals);
      const upperBound = toFixedWorklet(mulWorklet(nativeGasFee, 1 + BUFFER_RATIO), assetToSell.decimals);
      gasFeeRange.current = [lowerBound, upperBound];

      // update maxSwappableAmount for input asset if it's the native asset
      if (assetToSell.isNativeAsset) {
        updateMaxSwappableAmount(internalSelectedInputAsset, upperBound);
      }
    }

    hasEnoughFundsForGas.value = getHasEnoughFundsForGas(quote, gasFee, userNativeNetworkAsset);

    return () => {
      hasEnoughFundsForGas.value = undefined;
    };
  }, [assetToSell, estimatedGasLimit, gasSettings, hasEnoughFundsForGas, internalSelectedInputAsset, quote, userNativeNetworkAsset]);

  return null;
}
