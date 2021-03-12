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
  isZero,
  multiply,
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

  const priceImpact = tradeDetails?.priceImpact;

  let inputPriceValue = genericAssets[inputCurrencyAddress]?.price?.value;
  let outputPriceValue = genericAssets[outputCurrencyAddress]?.price?.value;

  const executionRate = tradeDetails?.executionPrice?.toSignificant();

  const originalOutputAmount = divide(
    outputAmount ?? 0,
    subtract(1, divide(priceImpact?.toSignificant() ?? 0, 100))
  );

  const realExecutionRate =
    inputAmount && !isZero(inputAmount)
      ? divide(originalOutputAmount, inputAmount)
      : 0;
  const realInverseExecutionRate =
    inputAmount && originalOutputAmount && !isZero(originalOutputAmount)
      ? divide(inputAmount, originalOutputAmount)
      : 0;

  if (!outputPriceValue && inputPriceValue && realInverseExecutionRate) {
    outputPriceValue = multiply(inputPriceValue, realInverseExecutionRate);
  }

  if (!inputPriceValue && outputPriceValue && executionRate) {
    inputPriceValue = multiply(outputPriceValue, realExecutionRate);
  }

  let priceImpactNativeAmount = null;
  let impact = null;
  let priceImpactPercentDisplay = null;
  if (inputAmount && outputAmount && inputPriceValue && outputPriceValue) {
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
