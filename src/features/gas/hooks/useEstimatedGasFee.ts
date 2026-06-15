import { useMemo } from 'react';

import { formatUnits } from 'viem';

import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { formatNumber, multiply } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { type ChainId } from '@/state/backendNetworks/types';
import { useNativeAsset } from '@/utils/ethereumUtils';

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
