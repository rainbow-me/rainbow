import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { add, multiply } from '@/__swaps__/utils/numbers';
import { Network } from '@/helpers';
import { getNetworkObj } from '@/networks';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { formatUnits } from 'viem';
import { formatCurrency, formatNumber } from './formatNumber';
import { useRouteChainId, useRouteNetwork } from './useRouteNetwork';
import { useSelectedGas } from './useSelectedGas';
import { useSwapEstimatedGasLimit } from './useSwapEstimatedGasLimit';

export function useEstimatedGasFee({ network, gasLimit }: { network: Network; gasLimit: string | undefined }) {
  const nativeNetworkAsset = useNativeAssetForNetwork(network);

  const chainId = getNetworkObj(network).id;
  const gasSettings = useSelectedGas(chainId);

  if (!gasLimit || !gasSettings || !nativeNetworkAsset) return 'Loading...'; // TODO: loading state

  const amount = gasSettings.isEIP1559 ? add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee) : gasSettings.gasPrice;

  const totalWei = multiply(gasLimit, amount);
  const nativePrice = nativeNetworkAsset.price.value?.toString();

  if (!nativePrice) return `${formatNumber(weiToGwei(totalWei))} Gwei`;

  const gasAmount = formatUnits(BigInt(totalWei), nativeNetworkAsset.decimals).toString();
  const feeInUserCurrency = multiply(nativePrice, gasAmount);

  return formatCurrency(feeInUserCurrency);
}

export function useSwapEstimatedGasFee() {
  const network = useRouteNetwork();
  const chainId = useRouteChainId();

  const assetToSell = useSwapsStore(s => s.inputAsset);
  const quote = useSwapsStore(s => s.quote);

  const { data: gasLimit } = useSwapEstimatedGasLimit({ chainId, quote, assetToSell });

  return useEstimatedGasFee({ network, gasLimit });
}
