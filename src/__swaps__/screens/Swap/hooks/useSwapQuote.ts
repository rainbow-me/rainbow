import {
  CrosschainQuote,
  ETH_ADDRESS,
  Quote,
  QuoteError,
  QuoteParams,
  Source,
  SwapType,
  getCrosschainQuote,
  getQuote,
} from '@rainbow-me/swaps';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { ParsedSearchAsset } from '../types/assets';
import { ChainId } from '../types/chains';
import { convertAmountToRawAmount } from '../utils/numbers';
import { isUnwrapEth, isWrapEth } from '../utils/swaps';
import { useAccountSettings } from '@/hooks';
import { inputKeys } from '../types/swap';
import Animated from 'react-native-reanimated';

const SWAP_POLLING_INTERVAL = 5000;
const CACHE_INTERVAL = 1000;

interface UseSwapQuotesProps {
  assetToSell: ParsedSearchAsset | null;
  assetToBuy: ParsedSearchAsset | null;
  assetToSellValue?: string;
  assetToBuyValue?: string;
  focusedInput: Animated.SharedValue<inputKeys>;
  source: Source | 'auto';
  slippage: string;
}

export const useSwapQuote = ({
  assetToSell,
  assetToBuy,
  assetToSellValue,
  assetToBuyValue,
  focusedInput,
  slippage,
  source,
}: UseSwapQuotesProps) => {
  const { accountAddress: currentAddress, network: currentNetwork } = useAccountSettings();

  const isCrosschainSwap = useMemo(
    () => !!assetToSell && !!assetToBuy && assetToSell?.chainId !== assetToBuy?.chainId,
    [assetToBuy, assetToSell]
  );

  const quotesParams: QuoteParams | undefined = useMemo(() => {
    const paramsReady =
      assetToSell && assetToBuy && (focusedInput.value === 'inputAmount' ? Number(assetToBuyValue) : Number(assetToSellValue));
    if (!paramsReady) return undefined;

    return {
      source: source === 'auto' ? undefined : source,
      chainId: assetToSell.chainId,
      fromAddress: currentAddress,
      sellTokenAddress: assetToSell.isNativeAsset ? ETH_ADDRESS : assetToSell.address,
      buyTokenAddress: assetToBuy.isNativeAsset ? ETH_ADDRESS : assetToBuy.address,
      sellAmount:
        (focusedInput.value === 'outputAmount' || focusedInput.value === 'outputNativeValue') && Number(assetToSellValue)
          ? convertAmountToRawAmount(assetToSellValue || '0', assetToSell.decimals)
          : undefined,
      buyAmount:
        focusedInput.value === 'inputAmount' && Number(assetToBuyValue)
          ? convertAmountToRawAmount(assetToBuyValue || '0', assetToBuy.decimals)
          : undefined,
      slippage: Number(slippage),
      refuel: false,
      swapType: isCrosschainSwap ? SwapType.crossChain : SwapType.normal,
      toChainId: isCrosschainSwap ? assetToBuy.chainId : assetToSell.chainId,
    };
  }, [assetToBuy, assetToBuyValue, assetToSell, assetToSellValue, currentAddress, focusedInput, isCrosschainSwap, slippage, source]);

  const { data, isLoading, isError, fetchStatus } = useQuery({
    queryFn: () =>
      quotesParams && ((isCrosschainSwap ? getCrosschainQuote : getQuote)(quotesParams) as Promise<Quote | CrosschainQuote | QuoteError>),
    queryKey: ['getSwapQuote', quotesParams],
    enabled: !!quotesParams,
    refetchInterval: SWAP_POLLING_INTERVAL,
    cacheTime: CACHE_INTERVAL,
  });

  const isWrapOrUnwrapEth = useMemo(() => {
    if (!data || (data as QuoteError).error) return false;
    const quote = data as Quote | CrosschainQuote;
    return (
      isWrapEth({
        buyTokenAddress: quote?.buyTokenAddress,
        sellTokenAddress: quote?.sellTokenAddress,
        chainId: assetToSell?.chainId || ChainId.mainnet,
        currentNetwork,
      }) ||
      isUnwrapEth({
        buyTokenAddress: quote?.buyTokenAddress,
        sellTokenAddress: quote?.sellTokenAddress,
        chainId: assetToSell?.chainId || ChainId.mainnet,
        currentNetwork,
      })
    );
  }, [assetToSell?.chainId, currentNetwork, data]);

  const quote = useMemo(() => {
    if (!data || (data as QuoteError)?.error) return data;
    const quote = data as Quote | CrosschainQuote;
    return {
      ...quote,
      buyAmountDisplay: isWrapOrUnwrapEth ? quote.buyAmount : quote.buyAmountDisplay,
      sellAmountDisplay: isWrapOrUnwrapEth ? quote.sellAmount : quote.sellAmountDisplay,
      feeInEth: isWrapOrUnwrapEth ? '0' : quote.feeInEth,
      fromChainId: assetToSell?.chainId,
      toChainId: assetToBuy?.chainId,
    };
  }, [assetToBuy?.chainId, assetToSell?.chainId, data, isWrapOrUnwrapEth]);

  return {
    data: quote,
    isLoading: isLoading && fetchStatus !== 'idle',
    isError,
    isCrosschainSwap,
    isWrapOrUnwrapEth,
  };
};
