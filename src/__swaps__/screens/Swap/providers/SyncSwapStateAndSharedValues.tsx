import BigNumber from 'bignumber.js';
import {
  divWorklet,
  greaterThanWorklet,
  isNumberStringWorklet,
  lessThanOrEqualToWorklet,
  lessThanWorklet,
  mulWorklet,
  powWorklet,
  subWorklet,
  sumWorklet,
  toFixedWorklet,
  toScaledIntegerWorklet,
} from '@/safe-math/SafeMath';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { ParsedAddressAsset } from '@/entities';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { deepEqual } from '@/worklets/comparisons';
import { debounce } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { runOnJS, runOnUI, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { create } from 'zustand';
import { GasSettings } from '../hooks/useCustomGas';
import { useSelectedGas } from '../hooks/useSelectedGas';
import { useSwapEstimatedGasLimit } from '../hooks/useSwapEstimatedGasLimit';
import { useSwapContext } from './swap-provider';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getSwapsNavigationParams } from '../navigateToSwaps';

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
    () => ({ quote: quote.value }),
    (current, prev) => {
      if (!assetToSell.value || (prev !== null && current.quote && 'error' in current.quote)) return;

      const isSwappingMoreThanAvailableBalance =
        !!current.quote &&
        !('error' in current.quote) &&
        greaterThanWorklet(
          current.quote.sellAmount.toString(),
          toScaledIntegerWorklet(assetToSell.value.balance.amount, assetToSell.value.decimals)
        );

      // Skip gas fee recalculation if the user is trying to swap more than their available balance, as it isn't
      // needed and was previously resulting in errors in useEstimatedGasFee.
      if (isSwappingMoreThanAvailableBalance) return;

      if (!deepEqual(current, prev)) {
        runOnJS(setInternalSyncedSwapStore)({
          assetToBuy: assetToBuy.value ?? undefined,
          assetToSell: assetToSell.value,
          chainId: assetToSell.value?.chainId,
          quote: current.quote,
        });
      }
    },
    []
  );

  return null;
};

const isFeeNaNWorklet = (value: string | undefined) => {
  'worklet';

  return isNaN(Number(value)) || typeof value === 'undefined';
};

export function calculateGasFeeWorklet(gasSettings: GasSettings, gasLimit: string) {
  'worklet';

  if (gasSettings.isEIP1559) {
    const maxBaseFee = isFeeNaNWorklet(gasSettings.maxBaseFee) ? '0' : gasSettings.maxBaseFee;
    const maxPriorityFee = isFeeNaNWorklet(gasSettings.maxPriorityFee) ? '0' : gasSettings.maxPriorityFee;
    return mulWorklet(gasLimit, sumWorklet(maxBaseFee, maxPriorityFee));
  }

  const gasPrice = isFeeNaNWorklet(gasSettings.gasPrice) ? '0' : gasSettings.gasPrice;
  return mulWorklet(gasLimit, gasPrice);
}

export function formatUnitsWorklet(value: string, decimals: number) {
  'worklet';
  let display = value;
  const negative = display.startsWith('-');
  if (negative) display = display.slice(1);

  display = display.padStart(decimals, '0');

  // eslint-disable-next-line prefer-const
  let [integer, fraction] = [display.slice(0, display.length - decimals), display.slice(display.length - decimals)];
  fraction = fraction.replace(/(0+)$/, '');
  return `${negative ? '-' : ''}${integer || '0'}${fraction ? `.${fraction}` : ''}`;
}

const getHasEnoughFundsForGasWorklet = ({
  gasFee,
  nativeNetworkAsset,
  quoteValue,
}: {
  gasFee: string;
  nativeNetworkAsset: ParsedAddressAsset | undefined;
  quoteValue: string;
}) => {
  'worklet';
  if (!nativeNetworkAsset) return false;

  const userBalance = nativeNetworkAsset.balance?.amount || '0';
  const safeGasFee = isNumberStringWorklet(gasFee) ? gasFee : '0';
  const totalNativeSpentInTx = formatUnitsWorklet(sumWorklet(quoteValue, safeGasFee), nativeNetworkAsset.decimals);

  return lessThanOrEqualToWorklet(totalNativeSpentInTx, userBalance);
};

export function SyncGasStateToSharedValues() {
  const { hasEnoughFundsForGas, internalSelectedInputAsset } = useSwapContext();

  const [initialInfo] = useState(() => {
    const params = getSwapsNavigationParams();
    return {
      assetToSell: params.inputAsset,
      chainId: params.inputAsset?.chainId || useSwapsStore.getState().preferredNetwork || ChainId.mainnet,
    };
  });

  const { assetToSell = initialInfo.assetToSell, chainId = initialInfo.chainId, quote } = useSyncedSwapQuoteStore();
  const gasSettings = useSelectedGas(chainId);

  const nativeAssets = useBackendNetworksStore(state => state.getChainsNativeAsset());
  const nativeCurrencyUniqueId = useMemo(() => getUniqueId(nativeAssets[chainId]?.address, chainId), [chainId, nativeAssets]);

  const isLoadingNativeNetworkAsset = useUserAssetsStore(state => state.getStatus().isInitialLoading);
  const userNativeNetworkAsset = useUserAssetsStore(state => state.getLegacyUserAsset(nativeCurrencyUniqueId));

  const estimatedGasLimit = useSwapEstimatedGasLimit({ chainId, assetToSell, quote });

  const gasFeeRange = useSharedValue<[string, string] | null>(null);

  useAnimatedReaction(
    () => ({
      bufferRange: gasFeeRange.value,
      inputAsset: {
        chainId: internalSelectedInputAsset.value?.chainId,
        isNativeAsset: internalSelectedInputAsset.value?.isNativeAsset,
        uniqueId: internalSelectedInputAsset.value?.uniqueId,
      },
    }),
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
            const maxSwappableAmount = subWorklet(asset.balance.amount, currBuffer);
            return {
              ...asset,
              maxSwappableAmount: lessThanWorklet(maxSwappableAmount, 0) ? '0' : maxSwappableAmount,
            };
          });
        }
      }
    },
    []
  );

  useEffect(() => {
    const isValidQuote = quote && !('error' in quote);
    const safeQuoteValue = isValidQuote && quote.value ? new BigNumber(quote.value.toString()).toFixed() : '0';

    runOnUI(() => {
      hasEnoughFundsForGas.value = undefined;
      if (!gasSettings || !isValidQuote || !estimatedGasLimit || isLoadingNativeNetworkAsset) return;

      // NOTE: if we don't have a gas price or max base fee or max priority fee, we can't calculate the gas fee
      if (
        (gasSettings.isEIP1559 && !(gasSettings.maxBaseFee || gasSettings.maxPriorityFee)) ||
        (!gasSettings.isEIP1559 && !gasSettings.gasPrice)
      ) {
        return;
      }

      if (!userNativeNetworkAsset) {
        hasEnoughFundsForGas.value = false;
        return;
      }

      const gasFee = calculateGasFeeWorklet(gasSettings, estimatedGasLimit);
      if (isNaN(Number(gasFee))) {
        return;
      }

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

      hasEnoughFundsForGas.value = getHasEnoughFundsForGasWorklet({
        gasFee,
        nativeNetworkAsset: userNativeNetworkAsset,
        quoteValue: safeQuoteValue,
      });
    })();

    return () => {
      hasEnoughFundsForGas.value = undefined;
    };
  }, [
    estimatedGasLimit,
    gasFeeRange,
    gasSettings,
    hasEnoughFundsForGas,
    internalSelectedInputAsset,
    quote,
    userNativeNetworkAsset,
    isLoadingNativeNetworkAsset,
    chainId,
  ]);

  return null;
}
