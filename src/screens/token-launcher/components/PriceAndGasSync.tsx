import { memo, useEffect, useMemo } from 'react';

import { formatUnits } from 'viem';

import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { safeBigInt } from '@/features/gas/hooks/useEstimatedGasFee';
import { useGasSettings } from '@/features/gas/hooks/useSelectedGas';
import { GasSpeed } from '@/features/gas/types/gasSpeed';
import { lessThanOrEqualToWorklet } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

import { TOKEN_LAUNCH_GAS_LIMIT } from '../constants';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';

// Handles syncing price and gas data without triggering high level re-renders
function _PriceAndGasSync() {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const chainId = useTokenLauncherStore(state => state.chainId);
  const setChainNativeAssetRequiredForTransactionGas = useTokenLauncherStore(state => state.setChainNativeAssetRequiredForTransactionGas);
  const setHasSufficientChainNativeAssetForTransactionGas = useTokenLauncherStore(
    state => state.setHasSufficientChainNativeAssetForTransactionGas
  );
  const chainNativeAsset = useBackendNetworksStore(state => state.getChainsNativeAsset()[chainId]);
  const gasSettings = useGasSettings(chainId, GasSpeed.FAST);
  const userNativeAsset = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));

  const setChainNativeAssetUsdPrice = useTokenLauncherStore(state => state.setChainNativeAssetUsdPrice);
  const setChainNativeAssetNativePrice = useTokenLauncherStore(state => state.setChainNativeAssetNativePrice);

  const chainNativeAssetRequiredForTransactionGas = useMemo(() => {
    if (!gasSettings) return '0';

    const gasFeeWei = calculateGasFeeWorklet(gasSettings, TOKEN_LAUNCH_GAS_LIMIT);

    return formatUnits(safeBigInt(gasFeeWei), chainNativeAsset.decimals);
  }, [chainNativeAsset, gasSettings]);

  useEffect(() => {
    const userBalance = userNativeAsset?.balance?.amount || '0';

    const hasSufficientChainNativeAssetForTransactionGas = lessThanOrEqualToWorklet(chainNativeAssetRequiredForTransactionGas, userBalance);
    setChainNativeAssetRequiredForTransactionGas(chainNativeAssetRequiredForTransactionGas);
    setHasSufficientChainNativeAssetForTransactionGas(hasSufficientChainNativeAssetForTransactionGas);
  }, [
    chainNativeAssetRequiredForTransactionGas,
    setHasSufficientChainNativeAssetForTransactionGas,
    setChainNativeAssetRequiredForTransactionGas,
    userNativeAsset,
  ]);

  // We explicitly need it in USD as well as the user's native currency because the target market cap is in USD
  const { data: chainNativeAssetUsd } = useExternalToken(
    {
      address: chainNativeAsset.address,
      chainId: chainId,
      currency: 'USD',
    },
    {
      keepPreviousData: true,
      staleTime: time.minutes(1),
    }
  );
  const { data: chainNativeAssetNative } = useExternalToken(
    {
      address: chainNativeAsset.address,
      chainId: chainId,
      currency: nativeCurrency,
    },
    {
      keepPreviousData: true,
      staleTime: time.minutes(1),
    }
  );

  const chainNativeAssetUsdPrice = chainNativeAssetUsd?.price.value;
  const chainNativeAssetNativePrice = chainNativeAssetNative?.price.value;

  useEffect(() => {
    if (chainNativeAssetUsdPrice) {
      setChainNativeAssetUsdPrice(chainNativeAssetUsdPrice);
    }
    if (chainNativeAssetNativePrice) {
      setChainNativeAssetNativePrice(chainNativeAssetNativePrice);
    }
  }, [chainNativeAssetNativePrice, chainNativeAssetUsdPrice, setChainNativeAssetNativePrice, setChainNativeAssetUsdPrice]);

  return null;
}

export const PriceAndGasSync = memo(_PriceAndGasSync, () => true);
