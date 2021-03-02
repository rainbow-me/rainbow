import { Fraction, Trade } from '@uniswap/sdk';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { useTheme } from '@rainbow-me/context';
import { AppState } from '@rainbow-me/redux/store';
import {
  abs,
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeAmount,
  convertAmountToNativeDisplay,
  divide,
  isZero,
  multiply,
  subtract,
} from '@rainbow-me/utilities';

const PriceImpactWarningThreshold = new Fraction('5', '100');
const SeverePriceImpactThreshold = new Fraction('10', '100');

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

  const isHighPriceImpact =
    priceImpact?.greaterThan(PriceImpactWarningThreshold) ?? false;

  const isSeverePriceImpact =
    priceImpact?.greaterThan(SeverePriceImpactThreshold) ?? false;

  const priceImpactColor = isSeverePriceImpact
    ? colors.red
    : isHighPriceImpact
    ? colors.orange
    : colors.green;

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
  if (inputAmount && inputPriceValue && outputPriceValue) {
    const nativeAmount = convertAmountToNativeAmount(
      inputAmount,
      inputPriceValue
    );

    const outputNativeAmount = convertAmountAndPriceToNativeDisplay(
      outputAmount ?? 0,
      outputPriceValue,
      nativeCurrency
    ).amount;

    const nativeAmountDifference = abs(
      subtract(nativeAmount ?? 0, outputNativeAmount)
    );

    priceImpactNativeAmount = convertAmountToNativeDisplay(
      nativeAmountDifference,
      nativeCurrency
    );
  }

  return {
    inputPriceValue,
    isHighPriceImpact,
    outputPriceValue,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay: priceImpact?.toFixed(),
  };
}
