import { useMemo } from 'react';

import { formatUnits } from 'viem';

import { convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { formatNumber, multiply } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useNativeAsset } from '@/utils/ethereumUtils';

import { calculateEstimatedGasFeeWorklet } from '../utils/calculateGasFee';
import { useBaseFee } from '../utils/meteorology';
import { weiToGwei } from '../utils/parseGas';
import { type GasSettings } from './useCustomGas';

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
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { data: currentBaseFee } = useBaseFee({ chainId });

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const gasFee = calculateEstimatedGasFeeWorklet(gasSettings, gasLimit, currentBaseFee);
    if (isNaN(Number(gasFee))) {
      return;
    }

    const networkAssetPrice = nativeNetworkAsset.price.value?.toString();
    if (!networkAssetPrice) return `${formatNumber(weiToGwei(gasFee))} Gwei`;

    const feeFormatted = formatUnits(safeBigInt(gasFee), nativeNetworkAsset.decimals).toString();
    const feeInUserCurrency = multiply(networkAssetPrice, feeFormatted);

    return convertAmountToNativeDisplayWorklet(feeInUserCurrency, nativeCurrency, true);
  }, [currentBaseFee, gasLimit, gasSettings, nativeCurrency, nativeNetworkAsset?.decimals, nativeNetworkAsset?.price]);
}
