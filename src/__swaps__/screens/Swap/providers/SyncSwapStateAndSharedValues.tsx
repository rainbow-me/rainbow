import { greaterThanWorklet, toScaledIntegerWorklet } from '@/__swaps__/safe-math/SafeMath';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { add } from '@/__swaps__/utils/numbers';
import { ParsedAddressAsset } from '@/entities';
import { lessThan } from '@/helpers/utilities';
import { useUserNativeNetworkAsset } from '@/resources/assets/useUserAsset';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { debounce } from 'lodash';
import { useEffect } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { formatUnits } from 'viem';
import { create } from 'zustand';
import { calculateGasFee } from '../hooks/useEstimatedGasFee';
import { useSelectedGas } from '../hooks/useSelectedGas';
import { useSwapEstimatedGasLimit } from '../hooks/useSwapEstimatedGasLimit';
import { useSwapContext } from './swap-provider';

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

  return lessThan(totalNativeSpentInTx, userBalance);
};

export function SyncGasStateToSharedValues() {
  const {
    estimatedGasLimit: estimatedGasLimitSharedValue,
    gasSettings: gasSettingsSharedValue,
    enoughFundsForGas,
    internalSelectedInputAsset,
    SwapInputController,
  } = useSwapContext();

  const { assetToSell, chainId = ChainId.mainnet, quote } = useSyncedSwapQuoteStore();

  const gasSettings = useSelectedGas(chainId);
  const { data: userNativeNetworkAsset } = useUserNativeNetworkAsset(chainId);
  const { data: estimatedGasLimit } = useSwapEstimatedGasLimit({ chainId, assetToSell, quote });

  useEffect(() => {
    estimatedGasLimitSharedValue.value = estimatedGasLimit;
    gasSettingsSharedValue.value = gasSettings;

    if (!gasSettings || !estimatedGasLimit || !quote || 'error' in quote) {
      enoughFundsForGas.value = true;
      return;
    }

    const gasFee = calculateGasFee(gasSettings, estimatedGasLimit);
    enoughFundsForGas.value = getHasEnoughFundsForGas(quote, gasFee, userNativeNetworkAsset);

    return () => {
      enoughFundsForGas.value = true;
    };
  }, [
    estimatedGasLimitSharedValue,
    estimatedGasLimit,
    gasSettings,
    gasSettingsSharedValue,
    enoughFundsForGas,
    quote,
    internalSelectedInputAsset.value?.balance.amount,
    SwapInputController.inputValues.value.inputAmount,
    userNativeNetworkAsset,
  ]);

  return null;
}
