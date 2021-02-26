import { Fraction } from '@uniswap/sdk';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import useSwapDerivedOutputs from './useSwapDerivedOutputs';
import { useTheme } from '@rainbow-me/context';
import { AppState } from '@rainbow-me/redux/store';
import {
  convertAmountAndPriceToNativeDisplay,
  divide,
  subtract,
} from '@rainbow-me/utilities';

const PriceImpactWarningThreshold = new Fraction('5', '100');
const SeverePriceImpactThreshold = new Fraction('10', '100');

export default function usePriceImpactDetails() {
  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();
  const outputCurrencyAddress = useSelector(
    (state: AppState) => state.swap.outputCurrency?.address
  );
  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );
  const {
    derivedValues: { outputAmount },
    tradeDetails,
  } = useSwapDerivedOutputs();

  const priceImpact = tradeDetails?.priceImpact;

  const isHighPriceImpact =
    priceImpact?.greaterThan(PriceImpactWarningThreshold) ?? false;

  const isSeverePriceImpact =
    priceImpact?.greaterThan(SeverePriceImpactThreshold) ?? false;

  const color = isSeverePriceImpact
    ? colors.red
    : isHighPriceImpact
    ? colors.orange
    : colors.green;

  const outputPriceValue =
    genericAssets[outputCurrencyAddress]?.price?.value ?? 0;
  const originalOutputAmount = divide(
    outputAmount ?? 0,
    subtract(1, divide(priceImpact?.toSignificant() ?? 0, 100))
  );
  const outputAmountDifference = subtract(
    originalOutputAmount,
    outputAmount ?? 0
  );
  const {
    display: priceImpactNativeAmount,
  } = convertAmountAndPriceToNativeDisplay(
    outputAmountDifference,
    outputPriceValue,
    nativeCurrency
  );

  return {
    color,
    isHighPriceImpact,
    percentDisplay: priceImpact?.toFixed(),
    priceImpactNativeAmount,
  };
}
