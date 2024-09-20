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

export function calculateGasFee(gasSettings: GasSettings, gasLimit: string) {
  const amount = gasSettings.isEIP1559 ? add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee || '0') : gasSettings.gasPrice;
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
  const nativeNetworkAsset = useNativeAsset({ chainId });
  const { nativeCurrency } = useAccountSettings();

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const fee = calculateGasFee(gasSettings, gasLimit);

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
