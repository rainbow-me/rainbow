import BigNumber from 'bignumber.js';
import {
  divWorklet,
  equalWorklet,
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
import { analytics } from '@/analytics';
import Routes from '@/navigation/routesNames';

const BUFFER_RATIO = 0.5;

type InternalSyncedSwapState = {
  assetToSell: ExtendedAnimatedAssetWithColors | undefined;
  chainId: ChainId | undefined;
  quote: Quote | CrosschainQuote | QuoteError | null;
};

export const useSyncedSwapQuoteStore = create<InternalSyncedSwapState>(() => ({
  assetToSell: undefined,
  chainId: undefined,
  quote: null,
}));

const setInternalSyncedSwapStore = debounce((state: InternalSyncedSwapState) => useSyncedSwapQuoteStore.setState(state), 100, {
  leading: false,
  trailing: true,
});

export const SyncQuoteSharedValuesToState = () => {
  const { internalSelectedInputAsset: assetToSell, quote } = useSwapContext();

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

const reportInsufficientFunds = ({ nativeAssetSymbol }: { nativeAssetSymbol: string }) => {
  analytics.track(analytics.event.insufficientNativeAssetForAction, {
    type: Routes.SWAP,
    nativeAssetSymbol,
  });
};

const getHasEnoughFundsForGasWorklet = ({
  gasFee,
  quoteValue,
  userNativeAssetBalance,
  userNativeAssetDecimals,
  userNativeAssetSymbol,
  previousHadEnoughFunds,
}: {
  gasFee: string;
  quoteValue: string;
  userNativeAssetBalance: string | undefined;
  userNativeAssetDecimals: number;
  userNativeAssetSymbol: string;
  previousHadEnoughFunds: boolean | undefined;
}) => {
  'worklet';
  if (!userNativeAssetBalance || equalWorklet(userNativeAssetBalance, '0')) return false;

  const userBalance = userNativeAssetBalance || '0';
  const safeGasFee = isNumberStringWorklet(gasFee) ? gasFee : '0';
  const totalNativeSpentInTx = formatUnitsWorklet(sumWorklet(quoteValue, safeGasFee), userNativeAssetDecimals);

  const hasEnoughFundsForGas = lessThanOrEqualToWorklet(totalNativeSpentInTx, userBalance);

  if (!hasEnoughFundsForGas && hasEnoughFundsForGas !== previousHadEnoughFunds) {
    runOnJS(reportInsufficientFunds)({
      nativeAssetSymbol: userNativeAssetSymbol,
    });
  }

  return hasEnoughFundsForGas;
};

export function SyncGasStateToSharedValues() {
  const {
    SwapInputController: { updateMaxSwappableAmount },
    hasEnoughFundsForGas,
    internalSelectedInputAsset,
  } = useSwapContext();

  const [initialInfo] = useState(() => {
    const params = getSwapsNavigationParams();
    return {
      assetToSell: params.inputAsset,
      chainId: params.inputAsset?.chainId || useSwapsStore.getState().preferredNetwork || ChainId.mainnet,
    };
  });

  const { assetToSell = initialInfo.assetToSell, chainId = initialInfo.chainId, quote } = useSyncedSwapQuoteStore();
  const gasSettings = useSelectedGas(chainId);

  const nativeCurrencyUniqueId = useBackendNetworksStore(state => getUniqueId(state.getChainsNativeAsset()[chainId]?.address, chainId));

  const isLoadingNativeNetworkAsset = useUserAssetsStore(state => state.getStatus('isInitialLoad'));
  const userNativeNetworkAsset = useUserAssetsStore(state => state.getLegacyUserAsset(nativeCurrencyUniqueId));

  const estimatedGasLimit = useSwapEstimatedGasLimit({ chainId, assetToSell, quote });

  const gasFeeRange = useSharedValue<[string, string] | null>(null);

  useAnimatedReaction(
    () => ({
      bufferRange: gasFeeRange.value,
      inputAsset: {
        balance: internalSelectedInputAsset.value?.balance.amount,
        chainId: internalSelectedInputAsset.value?.chainId,
        isNativeAsset: internalSelectedInputAsset.value?.isNativeAsset,
        uniqueId: internalSelectedInputAsset.value?.uniqueId,
      },
    }),
    (current, previous) => {
      const isNativeAsset = current.inputAsset.isNativeAsset;
      if (!isNativeAsset) {
        if (current.bufferRange && current.inputAsset.chainId !== previous?.inputAsset?.chainId) {
          gasFeeRange.value = null;
        }
        return;
      }

      const { inputAsset: currInputAsset, bufferRange: currBufferRange } = current;
      const { inputAsset: prevInputAsset, bufferRange: prevBufferRange } = previous || {};

      const currBuffer = currBufferRange?.[1];
      const prevBuffer = prevBufferRange?.[1];

      if (currInputAsset?.chainId !== prevInputAsset?.chainId) {
        // reset gas fee range when input chain changes
        hasEnoughFundsForGas.value = undefined;
        if (currBuffer) gasFeeRange.value = null;
      } else if (isNativeAsset && currBuffer && (currBuffer !== prevBuffer || currInputAsset?.balance !== prevInputAsset?.balance)) {
        // update maxSwappableAmount when gas fee range is set and there is a change to input asset or gas fee range
        if (!currInputAsset.balance) return;

        if (hasEnoughFundsForGas.value === false) hasEnoughFundsForGas.value = undefined;

        const prevMaxSwappableAmount = internalSelectedInputAsset.value?.maxSwappableAmount;
        const newMaxSwappableAmount = subWorklet(currInputAsset.balance, currBuffer);

        if (!prevMaxSwappableAmount || !equalWorklet(newMaxSwappableAmount, prevMaxSwappableAmount)) {
          updateMaxSwappableAmount(newMaxSwappableAmount);
        }
      }
    },
    []
  );

  const gasFee = useMemo(() => {
    if (
      !gasSettings ||
      !estimatedGasLimit ||
      // NOTE: if we don't have a gas price or max base fee or max priority fee, we can't calculate the gas fee
      (gasSettings.isEIP1559 && !(gasSettings.maxBaseFee || gasSettings.maxPriorityFee)) ||
      (!gasSettings.isEIP1559 && !gasSettings.gasPrice)
    )
      return undefined;

    const gasFee = calculateGasFeeWorklet(gasSettings, estimatedGasLimit);
    return isNaN(Number(gasFee)) ? undefined : gasFee;
  }, [estimatedGasLimit, gasSettings]);

  const safeQuoteValue = useMemo(() => {
    const isValidQuote = !!quote && !('error' in quote);
    return isValidQuote && quote.value ? new BigNumber(quote.value.toString()).toFixed() : undefined;
  }, [quote]);

  useEffect(() => {
    if (!userNativeNetworkAsset) {
      hasEnoughFundsForGas.value = false;
      return;
    }

    if (!gasFee || !safeQuoteValue || isLoadingNativeNetworkAsset) {
      hasEnoughFundsForGas.value = undefined;
      return;
    }

    const userNativeAssetBalance = userNativeNetworkAsset.balance?.amount;
    const userNativeAssetDecimals = userNativeNetworkAsset.decimals;
    const userNativeAssetSymbol = userNativeNetworkAsset.symbol;

    runOnUI(() => {
      const nativeGasFee = divWorklet(gasFee, powWorklet(10, userNativeAssetDecimals));

      const isEstimateOutsideRange = !!(
        gasFeeRange.value &&
        (lessThanWorklet(nativeGasFee, gasFeeRange.value[0]) || greaterThanWorklet(nativeGasFee, gasFeeRange.value[1]))
      );

      if (nativeGasFee && (!gasFeeRange.value || isEstimateOutsideRange)) {
        const lowerBound = toFixedWorklet(mulWorklet(nativeGasFee, 1 - BUFFER_RATIO), userNativeAssetDecimals);
        const upperBound = toFixedWorklet(mulWorklet(nativeGasFee, 1 + BUFFER_RATIO), userNativeAssetDecimals);
        gasFeeRange.value = [lowerBound, upperBound];
      }

      hasEnoughFundsForGas.value = getHasEnoughFundsForGasWorklet({
        gasFee,
        quoteValue: safeQuoteValue,
        userNativeAssetBalance,
        userNativeAssetDecimals,
        userNativeAssetSymbol,
        previousHadEnoughFunds: hasEnoughFundsForGas.value,
      });
    })();
  }, [gasFee, gasFeeRange, hasEnoughFundsForGas, isLoadingNativeNetworkAsset, safeQuoteValue, userNativeNetworkAsset]);

  return null;
}
