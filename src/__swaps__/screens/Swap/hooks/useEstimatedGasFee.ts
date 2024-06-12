import { ChainId } from '@/__swaps__/types/chains';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { add, multiply } from '@/__swaps__/utils/numbers';
import ethereumUtils, { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { useMemo } from 'react';
import { formatUnits } from 'viem';

import { useSyncedSwapQuoteStore } from '../providers/SyncSwapStateAndSharedValues';
import { formatCurrency, formatNumber } from './formatNumber';
import { GasSettings } from './useCustomGas';
import { useSwapEstimatedGasLimit } from './useSwapEstimatedGasLimit';

function safeBigInt(value: string) {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

export function calculateGasFee(gasSettings: GasSettings, gasLimit: string) {
  const amount = gasSettings.isEIP1559 ? add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee) : gasSettings.gasPrice;
  return multiply(gasLimit, amount);
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

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const fee = calculateGasFee(gasSettings, gasLimit);
    const networkAssetPrice = nativeNetworkAsset.price.value?.toString();

    if (!networkAssetPrice) return `${formatNumber(weiToGwei(fee))} Gwei`;

    const feeFormatted = formatUnits(safeBigInt(fee), nativeNetworkAsset.decimals).toString();
    const feeInUserCurrency = multiply(networkAssetPrice, feeFormatted);

    return formatCurrency(feeInUserCurrency);
  }, [gasLimit, gasSettings, nativeNetworkAsset]);
}

export function useSwapEstimatedGasFee(gasSettings: GasSettings | undefined) {
  const { assetToSell, chainId = ChainId.mainnet, quote } = useSyncedSwapQuoteStore();
  const { data: estimatedGasLimit, isFetching } = useSwapEstimatedGasLimit({ chainId, assetToSell, quote });

  const estimatedFee = useEstimatedGasFee({ chainId, gasLimit: estimatedGasLimit, gasSettings });

  return useMemo(() => ({ isLoading: isFetching, data: estimatedFee }), [estimatedFee, isFetching]);
}
