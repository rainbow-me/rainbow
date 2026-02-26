import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { createQueryKey, type QueryFunctionArgs } from '@/react-query';
import { getProvider } from '@/handlers/web3';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { useMeteorologySuggestionMultichain } from '@/__swaps__/utils/meteorology';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import ethereumUtils from '@/utils/ethereumUtils';
import { add, convertAmountToNativeDisplayWorklet, multiply } from '@/helpers/utilities';
import { formatUnits } from 'viem';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import type { ChainId } from '@/state/backendNetworks/types';
import { GasSpeed } from '@/__swaps__/types/gas';

// Keep preview gas estimation aligned with delegation SDK buffering for authorization txs (+50k gas).
const REVOKE_GAS_BUFFER_MINIMUM = 50_000n;

// ///////////////////////////////////////////////
// Query Key

const estimateRevokeDelegationGasLimitQueryKey = ({ chainId, address }: { chainId: ChainId; address: string | undefined }) =>
  createQueryKey('estimateRevokeDelegationGasLimit', { chainId, address });

type EstimateRevokeDelegationGasLimitQueryKey = ReturnType<typeof estimateRevokeDelegationGasLimitQueryKey>;
type EstimateRevokeDelegationGasLimitQueryFunctionArgs = QueryFunctionArgs<typeof estimateRevokeDelegationGasLimitQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function estimateRevokeDelegationGasLimitQueryFunction({
  queryKey: [{ chainId, address }],
}: EstimateRevokeDelegationGasLimitQueryFunctionArgs) {
  if (!address || !chainId) return undefined;

  const provider = getProvider({ chainId });
  const estimate = await provider.estimateGas({ from: address, to: address });
  const estimatedGas = estimate.toBigInt();
  const multiplied = (estimatedGas * 12n) / 10n;
  const additive = estimatedGas + REVOKE_GAS_BUFFER_MINIMUM;
  return (multiplied > additive ? multiplied : additive).toString();
}

/** Multi-chain aggregation: fetches gas limits + meteorology for all chains in parallel, sums fees */
export function useRevokeDelegationGasFee(delegations: { chainId: number }[], address: string | undefined): string | undefined {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const chainIds = useMemo(() => delegations.map(d => d.chainId as ChainId), [delegations]);

  const estimateRevokeDelegationGasLimitQueries = useQueries({
    queries: chainIds.map(chainId => {
      const queryKey: EstimateRevokeDelegationGasLimitQueryKey = estimateRevokeDelegationGasLimitQueryKey({ chainId, address });

      return {
        queryKey,
        queryFn: estimateRevokeDelegationGasLimitQueryFunction,
        enabled: !!address && !!chainId,
      };
    }),
  });

  const meteorologyFastQueries = useMeteorologySuggestionMultichain({ chainIds, speed: GasSpeed.FAST, enabled: !!address });

  return useMemo(() => {
    let total = '0';
    for (let i = 0; i < chainIds.length; i++) {
      const estimatedGasLimit = estimateRevokeDelegationGasLimitQueries[i]?.data;
      const chainId = chainIds[i];

      if (!estimatedGasLimit) continue;

      const gasSettings = meteorologyFastQueries[i]?.data;
      if (!gasSettings) continue;

      const gasFeeWei = calculateGasFeeWorklet(gasSettings, estimatedGasLimit);
      if (isNaN(Number(gasFeeWei))) continue;

      const chainNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
      if (chainNativeAsset?.decimals == null) continue;
      const gasFeeNativeToken = formatUnits(safeBigInt(gasFeeWei), chainNativeAsset.decimals);
      const userNativeAsset = userAssetsStore.getState().getNativeAssetForChain(chainId);
      const nativeAssetPrice = (userNativeAsset?.price?.value || ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId }))?.toString();

      if (!nativeAssetPrice) continue;

      total = add(total, multiply(nativeAssetPrice, gasFeeNativeToken));
    }
    return convertAmountToNativeDisplayWorklet(total, nativeCurrency, true);
  }, [chainIds, estimateRevokeDelegationGasLimitQueries, meteorologyFastQueries, nativeCurrency]);
}
