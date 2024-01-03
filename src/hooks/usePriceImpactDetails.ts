import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { RainbowToken, SwappableAsset } from '@/entities';
import { Network } from '@/helpers';
import { AppState } from '@/redux/store';
import { ETH_ADDRESS, WETH_ADDRESS } from '@/references';
import { useTheme } from '@/theme';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToNativeAmount,
  convertAmountToNativeDisplay,
  convertAmountToPercentageDisplayWithThreshold,
  divide,
  greaterThanOrEqualTo,
  isPositive,
  subtract,
} from '@/helpers/utilities';
import { ethereumUtils } from '@/utils';

const PriceImpactWarningThreshold = 0.05;
const SeverePriceImpactThreshold = 0.1;

export default function usePriceImpactDetails(
  inputAmount: string | null,
  outputAmount: string | null,
  inputCurrency: SwappableAsset | null,
  outputCurrency: SwappableAsset | null,
  currentNetwork = Network.mainnet,
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

  let inputPriceValue =
    genericAssets[inputTokenAddress.toLowerCase()]?.price?.value;
  let outputPriceValue =
    genericAssets[outputTokenAddress.toLowerCase()]?.price?.value;

  // Override WETH price to ETH price
  if (inputTokenAddress?.toLowerCase() === WETH_ADDRESS) {
    inputPriceValue = genericAssets[ETH_ADDRESS]?.price?.value;
  } else if (outputTokenAddress?.toLowerCase() === WETH_ADDRESS) {
    outputPriceValue = genericAssets[ETH_ADDRESS]?.price?.value;
  }

  if (
    inputPriceValue === outputPriceValue ||
    !inputPriceValue ||
    !outputPriceValue
  ) {
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
    isSeverePriceImpact,
    outputPriceValue,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay,
  };
}
