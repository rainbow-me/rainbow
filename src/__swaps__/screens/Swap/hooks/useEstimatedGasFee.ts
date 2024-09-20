import { ChainId } from '@/chains/types';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { add, convertAmountToNativeDisplayWorklet, formatNumber, multiply } from '@/__swaps__/utils/numbers';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { useMemo } from 'react';
import { formatUnits } from 'viem';

import { useAccountSettings } from '@/hooks';
import { useSyncedSwapQuoteStore } from '../providers/SyncSwapStateAndSharedValues';
import { GasSettings } from './useCustomGas';
import { useSelectedGas } from './useSelectedGas';
import { useSwapEstimatedGasLimit } from './useSwapEstimatedGasLimit';

function safeBigInt(value: string) {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

const isFeeNaN = (value: string | undefined) => isNaN(Number(value)) || typeof value === 'undefined';

export function calculateGasFee(gasSettings: GasSettings, gasLimit: string) {
  if (gasSettings.isEIP1559) {
    if (isFeeNaN(gasSettings.maxBaseFee) || isFeeNaN(gasSettings.maxPriorityFee)) {
      return null;
    }

    return multiply(gasLimit, add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee));
  }

  if (isFeeNaN(gasSettings.gasPrice)) {
    return null;
  }

  return multiply(gasLimit, gasSettings.gasPrice);
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
  const nativeNetworkAsset = useNativeAsset({ chainId });
  const { nativeCurrency } = useAccountSettings();

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const fee = calculateGasFee(gasSettings, gasLimit);
    if (!fee) return;

    const networkAssetPrice = nativeNetworkAsset.price.value?.toString();
    if (!networkAssetPrice) return `${formatNumber(weiToGwei(fee))} Gwei`;

    const feeFormatted = formatUnits(safeBigInt(fee), nativeNetworkAsset.decimals).toString();
    const feeInUserCurrency = multiply(networkAssetPrice, feeFormatted);

    return convertAmountToNativeDisplayWorklet(feeInUserCurrency, nativeCurrency, true);
  }, [gasLimit, gasSettings, nativeCurrency, nativeNetworkAsset?.decimals, nativeNetworkAsset?.price]);
}

export function useSwapEstimatedGasFee(overrideGasSettings?: GasSettings) {
  const { assetToSell, quote, chainId = ChainId.mainnet } = useSyncedSwapQuoteStore();
  const gasSettings = useSelectedGas(chainId);

  const { data: estimatedGasLimit, isFetching } = useSwapEstimatedGasLimit({ chainId, assetToSell, quote });
  const estimatedFee = useEstimatedGasFee({ chainId, gasLimit: estimatedGasLimit, gasSettings: overrideGasSettings || gasSettings });

  return {
    data: estimatedFee,
    isFetching,
  };
}
