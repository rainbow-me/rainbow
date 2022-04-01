import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { useTheme } from '@rainbow-me/context';
import { UniswapCurrency } from '@rainbow-me/entities';
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
// import { logger } from '@rainbow-me/utils';

const PriceImpactWarningThreshold = 0.05;
const SeverePriceImpactThreshold = 0.1;

export default function usePriceImpactDetails(
  inputAmount: string | null,
  outputAmount: string | null,
  inputCurrency: UniswapCurrency | null,
  outputCurrency: UniswapCurrency | null
) {
  const { nativeCurrency } = useAccountSettings();
  const { colors } = useTheme();

  const genericAssets = useSelector(
    (state: AppState) => state.data.genericAssets
  );

  if (!inputCurrency || !outputCurrency) {
    return {
      inputPriceValue: 0,
      isHighPriceImpact: false,
      outputPriceValue: 0,
    };
  }

  if (!inputCurrency || !outputCurrency || inputAmount === outputAmount) {
    return {
      inputPriceValue: 0,
      isHighPriceImpact: false,
      outputPriceValue: 0,
    };
  }

  let inputPriceValue = genericAssets[inputCurrency?.address]?.price?.value;
  let outputPriceValue = genericAssets[outputCurrency?.address]?.price?.value;

  let priceImpactNativeAmount = null;
  let impact = null;
  let priceImpactPercentDisplay = null;
  let inputNativeAmount = null;
  let outputNativeAmount = null;
  if (inputAmount && outputAmount) {
    if (inputPriceValue && outputPriceValue) {
      inputNativeAmount = convertAmountToNativeAmount(
        inputAmount,
        inputPriceValue
      );

      outputNativeAmount = convertAmountAndPriceToNativeDisplay(
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
  }

  const isHighPriceImpact =
    !!impact && greaterThanOrEqualTo(impact, PriceImpactWarningThreshold);
  const isSeverePriceImpact =
    !!impact && greaterThanOrEqualTo(impact, SeverePriceImpactThreshold);

  if (isHighPriceImpact) {
    // logger.debug(
    //   JSON.stringify(
    //     {
    //       inputAmount,
    //       inputC: inputCurrency.symbol,
    //       inputNativeAmount,
    //       outputAmount,
    //       outputC: outputCurrency.symbol,
    //       outputNativeAmount,
    //     },
    //     null,
    //     2
    //   )
    // );
  }

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
