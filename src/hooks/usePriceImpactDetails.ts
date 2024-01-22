import { useMemo } from 'react';
import useAccountSettings from './useAccountSettings';
import { RainbowToken, SwappableAsset } from '@/entities';
import { Network } from '@/helpers';

import { useTheme } from '@/theme';
import {
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplayWithThreshold,
  convertRawAmountToNativeDisplay,
  divide,
  greaterThanOrEqualTo,
  subtract,
} from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';
import { CrosschainQuote, Quote, SwapType } from '@rainbow-me/swaps';
import { useNativeAssetForNetwork } from '@/utils/ethereumUtils';

export enum SwapPriceImpactType {
  none = 'none',
  high = 'high',
  severe = 'severe',
}

const PriceImpactWarningThreshold = 0.05;
const SeverePriceImpactThreshold = 0.1;

export default function usePriceImpactDetails(
  inputCurrency: SwappableAsset | null,
  outputCurrency: SwappableAsset | null,
  tradeDetails: CrosschainQuote | Quote | null,
  currentNetwork = Network.mainnet
) {
  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();
  const nativeAsset = useNativeAssetForNetwork(currentNetwork);

  useMemo;

  const isNormalQuote = useMemo(
    () => tradeDetails?.swapType === SwapType.normal,
    [tradeDetails?.swapType]
  );

  const inputNativeAmount = useMemo(() => {
    if (isNormalQuote) {
      console.log('normal quote: ', {
        sellamount: tradeDetails?.sellAmountInEth.toString() || '',
        decimals: nativeAsset?.decimals || 18,
        price: nativeAsset?.price?.value || '0',
        nativeCurrency,
      });
      return convertRawAmountToNativeDisplay(
        tradeDetails?.sellAmountInEth.toString() || '',
        nativeAsset?.decimals || 18,
        nativeAsset?.price?.value || '0',
        nativeCurrency
      ).amount;
    } else {
      return convertRawAmountToNativeDisplay(
        tradeDetails?.sellAmount?.toString() || '',
        inputCurrency?.decimals || 18,
        inputCurrency?.price?.value || '0',
        nativeCurrency
      ).amount;
    }
  }, [
    isNormalQuote,
    tradeDetails?.sellAmountInEth,
    tradeDetails?.sellAmount,
    nativeAsset?.decimals,
    nativeAsset?.price?.value,
    nativeCurrency,
    inputCurrency?.decimals,
    inputCurrency?.price?.value,
  ]);

  const outputNativeAmount = useMemo(() => {
    if (isNormalQuote) {
      console.log('normal quote output: ', {
        sellamount: tradeDetails?.buyAmountInEth.toString() || '',
        decimals: nativeAsset?.decimals || 18,
        price: nativeAsset?.price?.value || '0',
        nativeCurrency,
      });
      return convertRawAmountToNativeDisplay(
        tradeDetails?.buyAmountInEth.toString() || '',
        nativeAsset?.decimals || 18,
        nativeAsset?.price?.value || '0',
        nativeCurrency
      ).amount;
    } else {
      return convertRawAmountToNativeDisplay(
        tradeDetails?.buyAmount?.toString() || '',
        outputCurrency?.decimals || 18,
        outputCurrency?.price?.value || '0',
        nativeCurrency
      ).amount;
    }
  }, [
    outputCurrency?.decimals,
    outputCurrency?.price?.value,
    nativeCurrency,
    isNormalQuote,
    nativeAsset?.decimals,
    nativeAsset?.price?.value,
    tradeDetails?.buyAmount,
    tradeDetails?.buyAmountInEth,
  ]);

  const inputTokenAddress =
    ethereumUtils.getMultichainAssetAddress(
      inputCurrency as RainbowToken,
      currentNetwork
    ) ?? '';
  const outputTokenAddress =
    ethereumUtils.getMultichainAssetAddress(
      outputCurrency as RainbowToken,
      currentNetwork
    ) ?? '';

  const { impactDisplay, priceImpact, percentDisplay } = useMemo(() => {
    const nativeAmountImpact = subtract(inputNativeAmount, outputNativeAmount);
    const priceImpact = divide(nativeAmountImpact, inputNativeAmount);
    const percentDisplay = convertAmountToPercentageDisplayWithThreshold(
      priceImpact
    );
    const impactDisplay = convertAmountToNativeDisplay(
      nativeAmountImpact,
      nativeCurrency
    );
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
    console.log({ inputNativeAmount, outputNativeAmount });
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
