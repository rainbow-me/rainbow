import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import { SwappableAsset } from '@/entities';

import { useTheme } from '@/theme';
import {
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplayWithThreshold,
  convertRawAmountToNativeDisplay,
  divide,
  greaterThanOrEqualTo,
  subtract,
} from '@/helpers/utilities';

import { CrosschainQuote, Quote } from '@rainbow-me/swaps';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { isUnwrapNative, isWrapNative } from '@/handlers/swap';
import { ChainId } from '@/chains/types';

export enum SwapPriceImpactType {
  none = 'none',
  high = 'high',
  severe = 'severe',
}

const PriceImpactWarningThreshold = 0.05;
const SeverePriceImpactThreshold = 0.1;
export const NO_PRICE_DATA_PERCENTAGE = '100.00%';

export default function usePriceImpactDetails(
  inputCurrency: SwappableAsset | null,
  outputCurrency: SwappableAsset | null,
  tradeDetails: CrosschainQuote | Quote | null,
  chainId: ChainId = ChainId.mainnet
) {
  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();

  const sellChainId = (
    (tradeDetails as CrosschainQuote)?.fromChainId ? (tradeDetails as CrosschainQuote)?.fromChainId : chainId
  ) as ChainId;
  const buyChainId = (outputCurrency?.chainId || chainId) as ChainId;
  const sellNativeAsset = useNativeAsset({ chainId: sellChainId });
  const buyNativeAsset = useNativeAsset({ chainId: buyChainId });

  const isWrapOrUnwrap = useMemo(() => {
    if (!tradeDetails) return false;
    return (
      isWrapNative({
        buyTokenAddress: tradeDetails?.buyTokenAddress,
        sellTokenAddress: tradeDetails?.sellTokenAddress,
        chainId: buyChainId,
      }) ||
      isUnwrapNative({
        buyTokenAddress: tradeDetails?.buyTokenAddress,
        sellTokenAddress: tradeDetails?.sellTokenAddress,
        chainId: buyChainId,
      })
    );
  }, [buyChainId, tradeDetails]);

  const inputNativeAmount = useMemo(() => {
    if (isWrapOrUnwrap) {
      if (!tradeDetails?.sellAmount || !inputCurrency?.price?.value) {
        return '';
      }

      return convertRawAmountToNativeDisplay(
        tradeDetails?.sellAmount?.toString(),
        inputCurrency?.decimals || 18,
        inputCurrency?.price?.value,
        nativeCurrency
      ).amount;
    } else {
      return convertRawAmountToNativeDisplay(
        tradeDetails?.sellAmountInEth?.toString() || '',
        sellNativeAsset?.decimals || 18,
        sellNativeAsset?.price?.value || '0',
        nativeCurrency
      ).amount;
    }
  }, [
    isWrapOrUnwrap,
    tradeDetails?.sellAmount,
    tradeDetails?.sellAmountInEth,
    inputCurrency?.price?.value,
    inputCurrency?.decimals,
    nativeCurrency,
    sellNativeAsset?.decimals,
    sellNativeAsset?.price?.value,
  ]);

  const outputNativeAmount = useMemo(() => {
    if (isWrapOrUnwrap) {
      if (!tradeDetails?.buyAmount || !inputCurrency?.price?.value) {
        return '';
      }
      return convertRawAmountToNativeDisplay(
        tradeDetails?.buyAmount?.toString(),
        inputCurrency?.decimals || 18,
        inputCurrency?.price?.value,
        nativeCurrency
      ).amount;
    } else {
      return convertRawAmountToNativeDisplay(
        tradeDetails?.buyAmountInEth?.toString() || '',
        buyNativeAsset?.decimals || 18,
        buyNativeAsset?.price?.value || '0',
        nativeCurrency
      ).amount;
    }
  }, [
    isWrapOrUnwrap,
    tradeDetails?.buyAmount,
    tradeDetails?.buyAmountInEth,
    inputCurrency?.price?.value,
    inputCurrency?.decimals,
    nativeCurrency,
    buyNativeAsset?.decimals,
    buyNativeAsset?.price?.value,
  ]);

  const { impactDisplay, priceImpact, percentDisplay } = useMemo(() => {
    const nativeAmountImpact = subtract(inputNativeAmount, outputNativeAmount);
    const priceImpact = divide(nativeAmountImpact, inputNativeAmount);
    const percentDisplay = convertAmountToPercentageDisplayWithThreshold(priceImpact);
    const impactDisplay = convertAmountToNativeDisplay(nativeAmountImpact, nativeCurrency);
    return { impactDisplay, priceImpact, percentDisplay };
  }, [outputNativeAmount, nativeCurrency, inputNativeAmount]);

  if (greaterThanOrEqualTo(priceImpact, SeverePriceImpactThreshold)) {
    return {
      priceImpact: {
        type: SwapPriceImpactType.severe,
        impactDisplay,
        color: colors.red,
        percentDisplay,
      },
      inputNativeAmount,
      outputNativeAmount,
    };
  } else if (greaterThanOrEqualTo(priceImpact, PriceImpactWarningThreshold)) {
    return {
      priceImpact: {
        type: SwapPriceImpactType.high,
        impactDisplay,
        color: colors.orange,
        percentDisplay,
      },
      inputNativeAmount,
      outputNativeAmount,
    };
  } else {
    return {
      priceImpact: {
        type: SwapPriceImpactType.none,
        impactDisplay,
        color: colors.green,
        percentDisplay,
      },
      inputNativeAmount,
      outputNativeAmount,
    };
  }
}
