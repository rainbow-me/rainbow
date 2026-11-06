import { useMemo } from 'react';

import { type ChainId } from '@/features/network/types/backendNetworks';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useNativeAsset } from '@/utils/ethereumUtils';

import { formatGasFee } from '../core/formatGasFee';
import { useMeteorologyStore } from '../data/meteorologyStore';
import { type GasSettings } from '../types/gas';
import { calculateEstimatedGasFeeWorklet } from '../utils/calculateGasFee';

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
  const currentBaseFee = useMeteorologyStore(s => s.get(chainId)?.currentBaseFee);

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const gasFee = calculateEstimatedGasFeeWorklet(gasSettings, gasLimit, currentBaseFee);
    return formatGasFee(gasFee, nativeNetworkAsset.decimals, nativeNetworkAsset.price.value, nativeCurrency);
  }, [currentBaseFee, gasLimit, gasSettings, nativeCurrency, nativeNetworkAsset?.decimals, nativeNetworkAsset?.price]);
}
