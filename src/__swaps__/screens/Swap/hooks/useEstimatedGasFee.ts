import { ChainId } from '@/__swaps__/types/chains';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { add, multiply, divide, subtract } from '@/__swaps__/utils/numbers';
import ethereumUtils, { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { formatCurrency, formatNumber } from './formatNumber';
import { GasSettings } from './useCustomGas';
import { useSwapEstimatedGasLimit } from './useSwapEstimatedGasLimit';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { useSwapContext } from '../providers/swap-provider';
import { greaterThanWorklet, toScaledIntegerWorklet } from '@/__swaps__/safe-math/SafeMath';

function safeBigInt(value: string) {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

export function useEstimatedGasFee({
  chainId,
  gasLimit,
  gasSettings,
}: {
  chainId: ChainId;
  gasLimit: string | undefined;
  gasSettings: GasSettings | undefined;
}) {
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const nativeNetworkAsset = useNativeAssetForNetwork(network);
  const { internalSelectedInputAsset } = useSwapContext();

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const amount = gasSettings.isEIP1559 ? add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee) : gasSettings.gasPrice;

    const totalWei = multiply(gasLimit, amount);

    if (internalSelectedInputAsset.value?.isNativeAsset) {
      console.log('TEST1');
      const gasFeeNativeCurrency = divide(totalWei, 10 ** internalSelectedInputAsset.value!.decimals);
      console.log('TEST2');
      const gasFeeWithBuffer = multiply(gasFeeNativeCurrency, 1.3);
      const maxSwappableAmount = subtract(internalSelectedInputAsset.value!.balance.amount, gasFeeWithBuffer);
      internalSelectedInputAsset.modify(prev => {
        'worklet';
        return {
          ...prev,
          maxSwappableAmount: Number(maxSwappableAmount) < 0 ? '0' : maxSwappableAmount,
        };
      });
    }

    const networkAssetPrice = nativeNetworkAsset.price.value?.toString();

    if (!networkAssetPrice) return `${formatNumber(weiToGwei(totalWei))} Gwei`;

    const gasAmount = formatUnits(safeBigInt(totalWei), nativeNetworkAsset.decimals).toString();
    const feeInUserCurrency = multiply(networkAssetPrice, gasAmount);

    return formatCurrency(feeInUserCurrency);
  }, [gasLimit, gasSettings, internalSelectedInputAsset, nativeNetworkAsset?.decimals, nativeNetworkAsset?.price]);
}

export function useSwapEstimatedGasFee(gasSettings: GasSettings | undefined) {
  const { internalSelectedInputAsset: assetToSell, internalSelectedOutputAsset: assetToBuy, quote } = useSwapContext();

  const [state, setState] = useState({
    assetToBuy: assetToBuy.value,
    assetToSell: assetToSell.value,
    chainId: assetToSell.value?.chainId ?? ChainId.mainnet,
    quote: quote.value,
  });

  const debouncedStateSet = useDebouncedCallback(setState, 100, { leading: false, trailing: true });

  // Updates the state as a single block in response to quote changes to ensure the gas fee is cleanly updated once
  useAnimatedReaction(
    () => quote.value,
    (current, previous) => {
      if (!assetToSell.value || !assetToBuy.value || !current || !previous || 'error' in current) return;

      const isSwappingMoreThanAvailableBalance = greaterThanWorklet(
        current.sellAmount.toString(),
        toScaledIntegerWorklet(assetToSell.value.maxSwappableAmount, assetToSell.value.decimals)
      );

      // Skip gas fee recalculation if the user is trying to swap more than their available balance, as it isn't
      // needed and was previously resulting in errors in useEstimatedGasFee.
      if (isSwappingMoreThanAvailableBalance) return;

      if (current !== previous) {
        runOnJS(debouncedStateSet)({
          assetToBuy: assetToBuy.value,
          assetToSell: assetToSell.value,
          chainId: assetToSell.value?.chainId ?? ChainId.mainnet,
          quote: current,
        });
      }
    }
  );

  const { data: gasLimit, isFetching } = useSwapEstimatedGasLimit(
    { chainId: state.chainId, quote: state.quote, assetToSell: state.assetToSell },
    {
      enabled: !!state.quote && !!state.assetToSell && !!state.assetToBuy && !('error' in quote),
    }
  );

  const estimatedFee = useEstimatedGasFee({ chainId: state.chainId, gasLimit, gasSettings });

  return useMemo(() => ({ isLoading: isFetching, data: estimatedFee }), [estimatedFee, isFetching]);
}
