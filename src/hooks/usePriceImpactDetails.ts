import { Fraction, Percent, Trade } from '@uniswap/sdk';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
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
  const extraTradeDetails = useSelector(
    (state: AppState) => state.swap.extraTradeDetails
  );
  const outputAmount = useSelector(
    (state: AppState) => state.swap.outputAmount?.value ?? 0
  );
  const tradeDetails: Trade = useSelector(
    (state: AppState) => state.swap.tradeDetails
  );

  const priceImpact: Percent = tradeDetails?.priceImpact;

  const isHighPriceImpact =
    priceImpact?.greaterThan(PriceImpactWarningThreshold) ?? false;

  const isSeverePriceImpact =
    priceImpact?.greaterThan(SeverePriceImpactThreshold) ?? false;

  const color = isSeverePriceImpact
    ? colors.red
    : isHighPriceImpact
    ? colors.orange
    : colors.green;

  const { outputPriceValue } = extraTradeDetails;
  const originalOutputAmount = divide(
    outputAmount,
    subtract(1, divide(priceImpact?.toSignificant() ?? 0, 100))
  );
  const outputAmountDifference = subtract(originalOutputAmount, outputAmount);
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
