import { ChainId } from '@/__swaps__/types/chains';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { add, multiply } from '@/__swaps__/utils/numbers';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import ethereumUtils, { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { formatUnits } from 'viem';
import { formatCurrency, formatNumber } from './formatNumber';
import { GasSettings } from './useCustomGas';
import { useSwapEstimatedGasLimit } from './useSwapEstimatedGasLimit';

export function useEstimatedGasFee({
  chainId,
  gasLimit,
  gasSettings,
}: {
  chainId: ChainId;
  gasLimit: string | undefined;
  gasSettings: GasSettings | undefined;
}) {
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const nativeNetworkAsset = useNativeAssetForNetwork(network);

  if (!gasLimit || !gasSettings || !nativeNetworkAsset) return 'Loading...'; // TODO: loading state

  const amount = gasSettings.isEIP1559 ? add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee) : '0'; // gasSettings.gasPrice;

  const totalWei = multiply(gasLimit, amount);
  const nativePrice = nativeNetworkAsset.price.value?.toString();

  if (!nativePrice) return `${formatNumber(weiToGwei(totalWei))} Gwei`;

  const gasAmount = formatUnits(BigInt(totalWei), nativeNetworkAsset.decimals).toString();
  const feeInUserCurrency = multiply(nativePrice, gasAmount);

  return formatCurrency(feeInUserCurrency);
}

export function useSwapEstimatedGasFee({ gasSettings }: { gasSettings: GasSettings | undefined }) {
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);

  const assetToSell = useSwapsStore(s => s.inputAsset);
  const quote = useSwapsStore(s => s.quote);

  const { data: gasLimit } = useSwapEstimatedGasLimit({ chainId, quote, assetToSell }, { enabled: !!quote });

  return useEstimatedGasFee({ chainId, gasLimit, gasSettings });
}
