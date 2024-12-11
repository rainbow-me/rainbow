import { ChainId } from '@/state/backendNetworks/types';
import { weiToGwei } from '@/parsers';
import { convertAmountToNativeDisplayWorklet, formatNumber, multiply } from '@/helpers/utilities';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { useMemo } from 'react';
import { formatUnits } from 'viem';

import { useAccountSettings } from '@/hooks';
import { calculateGasFeeWorklet, useSyncedSwapQuoteStore } from '../providers/SyncSwapStateAndSharedValues';
import { GasSettings } from './useCustomGas';
import { useSelectedGas } from './useSelectedGas';
import { useSwapEstimatedGasLimit } from './useSwapEstimatedGasLimit';
import { useSwapsStore } from '@/state/swaps/swapsStore';

export function safeBigInt(value: string) {
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
  const nativeNetworkAsset = useNativeAsset({ chainId });
  const { nativeCurrency } = useAccountSettings();

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const gasFee = calculateGasFeeWorklet(gasSettings, gasLimit);
    if (isNaN(Number(gasFee))) {
      return;
    }

    const networkAssetPrice = nativeNetworkAsset.price.value?.toString();
    if (!networkAssetPrice) return `${formatNumber(weiToGwei(gasFee))} Gwei`;

    const feeFormatted = formatUnits(safeBigInt(gasFee), nativeNetworkAsset.decimals).toString();
    const feeInUserCurrency = multiply(networkAssetPrice, feeFormatted);

    return convertAmountToNativeDisplayWorklet(feeInUserCurrency, nativeCurrency, true);
  }, [gasLimit, gasSettings, nativeCurrency, nativeNetworkAsset?.decimals, nativeNetworkAsset?.price]);
}

export function useSwapEstimatedGasFee(overrideGasSettings?: GasSettings) {
  const preferredNetwork = useSwapsStore(s => s.preferredNetwork);
  const { assetToSell, quote, chainId = preferredNetwork || ChainId.mainnet } = useSyncedSwapQuoteStore();
  const gasSettings = useSelectedGas(chainId);

  const { data: estimatedGasLimit, isFetching } = useSwapEstimatedGasLimit({ chainId, assetToSell, quote });
  const estimatedFee = useEstimatedGasFee({ chainId, gasLimit: estimatedGasLimit, gasSettings: overrideGasSettings || gasSettings });

  return {
    data: estimatedFee,
    isFetching,
  };
}
