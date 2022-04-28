import { ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS } from '@rainbow-me/swaps';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { useTheme } from '@rainbow-me/context';
import { UniswapCurrency } from '@rainbow-me/entities';
import { AppState } from '@rainbow-me/redux/store';
import { ETH_ADDRESS, WETH_ADDRESS } from '@rainbow-me/references';
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
  outputCurrency: UniswapCurrency | null,
  loading = false
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

  if (!inputCurrency || !outputCurrency) {
    return {
      inputPriceValue: 0,
      isHighPriceImpact: false,
      outputPriceValue: 0,
    };
  }

  const inputTokenAddress =
    inputCurrency.address?.toLowerCase() ===
    ETH_ADDRESS_AGGREGATORS.toLowerCase()
      ? ETH_ADDRESS
      : inputCurrency.address;
  const outputTokenAddress =
    outputCurrency.address?.toLowerCase() ===
    ETH_ADDRESS_AGGREGATORS.toLowerCase()
      ? ETH_ADDRESS
      : outputCurrency.address;

  let inputPriceValue = genericAssets[inputTokenAddress]?.price?.value;
  let outputPriceValue = genericAssets[outputTokenAddress]?.price?.value;

  // Override WETH price to ETH price
  if (inputTokenAddress.toLowerCase() === WETH_ADDRESS) {
    inputPriceValue = genericAssets[ETH_ADDRESS]?.price?.value;
  } else if (outputTokenAddress.toLowerCase() === WETH_ADDRESS) {
    outputPriceValue = genericAssets[ETH_ADDRESS]?.price?.value;
  }

  if (inputPriceValue === outputPriceValue) {
    return {
      inputPriceValue,
      isHighPriceImpact: false,
      outputPriceValue,
    };
  }

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
    !loading &&
    !!impact &&
    greaterThanOrEqualTo(impact, PriceImpactWarningThreshold);
  const isSeverePriceImpact =
    !loading &&
    !!impact &&
    greaterThanOrEqualTo(impact, SeverePriceImpactThreshold);

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
