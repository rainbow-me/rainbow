import { useEffect, useMemo, memo } from 'react';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { ChainId } from '@/state/backendNetworks/types';
import { time } from '@/utils';
import { useAccountSettings } from '@/hooks';
import { useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { formatUnits } from 'viem';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { lessThanOrEqualToWorklet } from '@/safe-math/SafeMath';

// TODO: these values will likely come from sdk
function estimateLaunchTransactionGasLimit({
  chainId,
  gasSettings,
  isPrebuying,
}: {
  chainId: ChainId;
  gasSettings: GasSettings | undefined;
  isPrebuying: boolean;
}) {
  return '8000000';
}

// Handles syncing price and gas data without triggering high level re-renders
function _PriceAndGasSync() {
  const { nativeCurrency } = useAccountSettings();

  const chainId = useTokenLauncherStore(state => state.chainId);
  const gasSpeed = useTokenLauncherStore(state => state.gasSpeed);
  const setChainNativeAssetRequiredForTransactionGas = useTokenLauncherStore(state => state.setChainNativeAssetRequiredForTransactionGas);
  const setHasSufficientChainNativeAssetForTransactionGas = useTokenLauncherStore(
    state => state.setHasSufficientChainNativeAssetForTransactionGas
  );
  const chainNativeAsset = useBackendNetworksStore(state => state.getChainsNativeAsset()[chainId]);
  const gasSettings = useGasSettings(chainId, gasSpeed);
  const userNativeAsset = useUserAssetsStore(state => state.getNativeAssetForChain(chainId));

  const setChainNativeAssetUsdPrice = useTokenLauncherStore(state => state.setChainNativeAssetUsdPrice);
  const setChainNativeAssetNativePrice = useTokenLauncherStore(state => state.setChainNativeAssetNativePrice);

  const chainNativeAssetRequiredForTransactionGas = useMemo(() => {
    if (!gasSettings) return '0';

    const gasLimit = estimateLaunchTransactionGasLimit({
      chainId,
      gasSettings,
      isPrebuying: false,
    });
    const gasFeeWei = calculateGasFeeWorklet(gasSettings, gasLimit);

    return formatUnits(safeBigInt(gasFeeWei), chainNativeAsset.decimals);
  }, [chainId, chainNativeAsset, gasSettings]);

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
