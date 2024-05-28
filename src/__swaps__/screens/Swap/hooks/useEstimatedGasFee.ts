import { ChainId } from '@/__swaps__/types/chains';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { add, multiply } from '@/__swaps__/utils/numbers';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import ethereumUtils, { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { useMemo } from 'react';
import { formatUnits } from 'viem';
import { formatCurrency, formatNumber } from './formatNumber';
import { GasSettings } from './useCustomGas';
import { useSwapEstimatedGasLimit } from './useSwapEstimatedGasLimit';

function safeBigInt(value: string) {
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
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const nativeNetworkAsset = useNativeAssetForNetwork(network);

  return useMemo(() => {
    if (!gasLimit || !gasSettings || !nativeNetworkAsset?.price) return;

    const amount = gasSettings.isEIP1559 ? add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee) : gasSettings.gasPrice;

    const totalWei = multiply(gasLimit, amount);
    const networkAssetPrice = nativeNetworkAsset.price.value?.toString();

    if (!networkAssetPrice) return `${formatNumber(weiToGwei(totalWei))} Gwei`;

    const gasAmount = formatUnits(safeBigInt(totalWei), nativeNetworkAsset.decimals).toString();
    const feeInUserCurrency = multiply(networkAssetPrice, gasAmount);

    return formatCurrency(feeInUserCurrency);
  }, [gasLimit, gasSettings, nativeNetworkAsset]);
}

const isSameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
export function useSwapEstimatedGasFee(gasSettings: GasSettings | undefined) {
  const chainId = useSwapsStore(s => s.inputAsset?.chainId || ChainId.mainnet);

  const assetToSell = useSwapsStore(s => s.inputAsset);
  const assetToBuy = useSwapsStore(s => s.outputAsset);
  const quote = useSwapsStore(s => s.quote);

  const { data: gasLimit, isFetching } = useSwapEstimatedGasLimit(
    { chainId, quote, assetToSell },
    {
      enabled:
        !!quote &&
        !!assetToSell &&
        !!assetToBuy &&
        !('error' in quote) &&
        // the quote and the input/output assets are not updated together,
        // we shouldn't try to estimate if the assets are not the same as the quote (probably still fetching a quote)
        isSameAddress(quote.sellTokenAddress, assetToSell.address) &&
        isSameAddress(quote.buyTokenAddress, assetToBuy.address),
    }
  );

  const estimatedFee = useEstimatedGasFee({ chainId, gasLimit, gasSettings });

  return useMemo(() => ({ isLoading: isFetching, data: estimatedFee }), [estimatedFee, isFetching]);
}
