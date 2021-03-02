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

  let inverseExecutionRate = null;
  if (tradeDetails && !tradeDetails?.executionPrice?.equalTo('0')) {
    inverseExecutionRate = tradeDetails?.executionPrice
      ?.invert()
      ?.toSignificant();
  }

  if (!outputPriceValue && inputPriceValue && inverseExecutionRate) {
    outputPriceValue = multiply(inputPriceValue, inverseExecutionRate);
  }

  if (!inputPriceValue && outputPriceValue && executionRate) {
    inputPriceValue = multiply(outputPriceValue, executionRate);
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
    isHighPriceImpact,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay: priceImpact?.toFixed(),
  };
}
