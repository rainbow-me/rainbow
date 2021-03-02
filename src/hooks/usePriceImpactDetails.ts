import { Fraction, Trade } from '@uniswap/sdk';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { useTheme } from '@rainbow-me/context';
import { AppState } from '@rainbow-me/redux/store';
import {
  abs,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeDisplay,
  subtract,
} from '@rainbow-me/utilities';

const PriceImpactWarningThreshold = new Fraction('5', '100');
const SeverePriceImpactThreshold = new Fraction('10', '100');

export default function usePriceImpactDetails(
  nativeAmount: string | null,
  outputAmount: string | null,
  tradeDetails: Trade
) {
  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();
  const outputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.outputCurrency?.address
  );
  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );

  const priceImpact = tradeDetails?.priceImpact;

  const isHighPriceImpact =
    priceImpact?.greaterThan(PriceImpactWarningThreshold) ?? false;

  const isSeverePriceImpact =
    priceImpact?.greaterThan(SeverePriceImpactThreshold) ?? false;

  const priceImpactColor = isSeverePriceImpact
    ? colors.red
    : isHighPriceImpact
    ? colors.orange
    : colors.green;

  const outputPriceValue =
    genericAssets[outputCurrencyAddress]?.price?.value ?? 0;

  const outputNativeAmount = convertAmountAndPriceToNativeDisplay(
    outputAmount ?? 0,
    outputPriceValue,
    nativeCurrency
  ).amount;

  const nativeAmountDifference = abs(
    subtract(nativeAmount ?? 0, outputNativeAmount)
  );

  const priceImpactNativeAmount = convertAmountToNativeDisplay(
    nativeAmountDifference,
    nativeCurrency
  );

  return {
    isHighPriceImpact,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay: priceImpact?.toFixed(),
  };
}
