import { Trade } from '@uniswap/sdk';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { useTheme } from '@rainbow-me/context';
import { AppState } from '@rainbow-me/redux/store';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeAmount,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplayWithThreshold,
  divide,
  greaterThanOrEqualTo,
  isPositive,
  subtract,
} from '@rainbow-me/utilities';

const PriceImpactWarningThreshold = 0.05;
const SeverePriceImpactThreshold = 0.1;

export default function usePriceImpactDetails(
  inputAmount: string | null,
  outputAmount: string | null,
  tradeDetails: Trade | null
) {
  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();
  const inputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.inputCurrency?.address
  );
  const outputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.outputCurrency?.address
  );
  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );

  let inputPriceValue = genericAssets[inputCurrencyAddress]?.price?.value;
  let outputPriceValue = genericAssets[outputCurrencyAddress]?.price?.value;

  let priceImpactNativeAmount = null;
  let impact = null;
  let priceImpactPercentDisplay = null;
  if (inputAmount && outputAmount) {
    if (inputPriceValue && outputPriceValue) {
      const inputNativeAmount = convertAmountToNativeAmount(
        inputAmount,
        inputPriceValue
      );

      const outputNativeAmount = convertAmountAndPriceToNativeDisplay(
        outputAmount,
        outputPriceValue,
        nativeCurrency
      ).amount;

      const nativeAmountDifference = subtract(
        inputNativeAmount,
        outputNativeAmount
      );

      if (isPositive(nativeAmountDifference)) {
        impact = divide(nativeAmountDifference, inputNativeAmount);
        priceImpactPercentDisplay = convertAmountToPercentageDisplayWithThreshold(
          impact
        );
        priceImpactNativeAmount = convertAmountToNativeDisplay(
          nativeAmountDifference,
          nativeCurrency
        );
      }
    } else {
      if (tradeDetails) {
        impact = divide(tradeDetails.priceImpact.toFixed(), 100);
        priceImpactPercentDisplay = convertAmountToPercentageDisplayWithThreshold(
          impact
        );
      }
    }
  }

  const isHighPriceImpact =
    !!impact && greaterThanOrEqualTo(impact, PriceImpactWarningThreshold);
  const isSeverePriceImpact =
    !!impact && greaterThanOrEqualTo(impact, SeverePriceImpactThreshold);

  const priceImpactColor = isSeverePriceImpact
    ? colors.red
    : isHighPriceImpact
    ? colors.orange
    : colors.green;

  return {
    inputPriceValue,
    isHighPriceImpact,
    outputPriceValue,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay,
  };
}
