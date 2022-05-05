import { ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS } from '@rainbow-me/swaps';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { useTheme } from '@rainbow-me/context';
import { EthereumAddress, UniswapCurrency } from '@rainbow-me/entities';
import { Network } from '@rainbow-me/helpers';
import { AppState } from '@rainbow-me/redux/store';
import {
  ARBITRUM_ETH_ADDRESS,
  ETH_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
  WETH_ADDRESS,
} from '@rainbow-me/references';
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

const getRealAddressForAsset = (address: EthereumAddress, network: Network) => {
  let realAddress =
    address?.toLowerCase() === ETH_ADDRESS_AGGREGATORS.toLowerCase()
      ? ETH_ADDRESS
      : address;

  if (
    network === Network.optimism &&
    address.toLowerCase() === OPTIMISM_ETH_ADDRESS
  ) {
    realAddress = ETH_ADDRESS;
  } else if (
    network === Network.arbitrum &&
    address.toLowerCase() === ARBITRUM_ETH_ADDRESS
  ) {
    realAddress = ETH_ADDRESS;
  } else if (
    network === Network.polygon &&
    address.toLowerCase() === MATIC_POLYGON_ADDRESS
  ) {
    realAddress = MATIC_POLYGON_ADDRESS;
  }

  return realAddress;
};

export default function usePriceImpactDetails(
  inputAmount: string | null,
  outputAmount: string | null,
  inputCurrency: UniswapCurrency | null,
  outputCurrency: UniswapCurrency | null,
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

  const inputTokenAddress = getRealAddressForAsset(
    inputCurrency?.mainnet_address || inputCurrency?.address,
    currentNetwork
  );
  const outputTokenAddress = getRealAddressForAsset(
    outputCurrency?.mainnet_address || outputCurrency?.address,
    currentNetwork
  );

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
