import { ETH_ADDRESS } from '@rainbow-me/swaps';
import {
  convertRawAmountToDecimalFormat,
  divide,
  multiply,
  subtract,
} from '@rainbow-me/helpers/utilities';
import { useSwapCurrencies } from '@rainbow-me/hooks';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useRainbowFee({ tradeDetails }) {
  const { inputCurrency } = useSwapCurrencies();

  const rainbowFeePercentage = useMemo(() => {
    const convertToNumber = Number(tradeDetails.feePercentageBasisPoints);
    return divide(convertToNumber, '1e18');
  }, [tradeDetails]);

  const rainbowFeeNative = useMemo(() => {
    // token to ETH
    if (inputCurrency?.price && tradeDetails.sellAmount) {
      if (
        tradeDetails.buyTokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase()
      ) {
        const feeInOutputTokensRawAmount = divide(
          multiply(
            tradeDetails.buyAmount,
            tradeDetails.feePercentageBasisPoints
          ),
          '1e18'
        );

        const feeInOutputToken = convertRawAmountToDecimalFormat(
          feeInOutputTokensRawAmount,
          18
        );

        const priceOfEth = ethereumUtils.getEthPriceUnit();

        return Number(feeInOutputToken) * priceOfEth;
        // eth to token or token to token
      } else {
        const feeInInputTokensRawAmount = subtract(
          tradeDetails.sellAmount,
          tradeDetails.sellAmountMinusFees
        );

        const feeInInputToken = convertRawAmountToDecimalFormat(
          feeInInputTokensRawAmount,
          inputCurrency.decimals
        );

        return (
          Number(feeInInputToken) * Number(inputCurrency.price.value)
        ).toFixed(2);
      }
    }
    return null;
  }, [
    inputCurrency.decimals,
    inputCurrency.price,
    tradeDetails.buyAmount,
    tradeDetails.buyTokenAddress,
    tradeDetails.feePercentageBasisPoints,
    tradeDetails.sellAmount,
    tradeDetails.sellAmountMinusFees,
  ]);

  return { rainbowFeeNative, rainbowFeePercentage };
}
