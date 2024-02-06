import { ETH_ADDRESS } from '@rainbow-me/swaps';
import { useEffect, useState } from 'react';
import { convertRawAmountToDecimalFormat, divide, multiply, subtract } from '@/helpers/utilities';
import { useAccountSettings, useSwapCurrencies } from '@/hooks';
import { ethereumUtils } from '@/utils';

export default function useRainbowFee({ tradeDetails, network }) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const { accountAddress } = useAccountSettings();
  const [nativeAsset, setNativeAsset] = useState(null);

  const rainbowFeePercentage = useMemo(() => {
    const convertToNumber = Number(tradeDetails.feePercentageBasisPoints);
    return divide(convertToNumber, '1e18');
  }, [tradeDetails]);

  const rainbowFeeNative = useMemo(() => {
    // token to ETH
    if (nativeAsset && inputCurrency?.price && tradeDetails.sellAmount) {
      if (tradeDetails.buyTokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase()) {
        const feeInOutputTokensRawAmount = divide(multiply(tradeDetails.buyAmount, tradeDetails.feePercentageBasisPoints), '1e18');

        const feeInOutputToken = convertRawAmountToDecimalFormat(feeInOutputTokensRawAmount, outputCurrency?.decimals || 18);

        return (Number(feeInOutputToken) * Number(nativeAsset.price.value)).toFixed(2);
        // eth to token or token to token
      } else {
        const feeInInputTokensRawAmount = subtract(tradeDetails.sellAmount, tradeDetails.sellAmountMinusFees);

        const feeInInputToken = convertRawAmountToDecimalFormat(feeInInputTokensRawAmount, inputCurrency.decimals);

        return (Number(feeInInputToken) * Number(inputCurrency.price.value)).toFixed(2);
      }
    }
    return null;
  }, [
    nativeAsset,
    inputCurrency.price,
    inputCurrency.decimals,
    tradeDetails.sellAmount,
    tradeDetails.buyTokenAddress,
    tradeDetails.buyAmount,
    tradeDetails.feePercentageBasisPoints,
    tradeDetails.sellAmountMinusFees,
    outputCurrency?.decimals,
  ]);

  useEffect(() => {
    const getNativeAsset = async () => {
      const nativeAsset = await ethereumUtils.getNativeAssetForNetwork(network, accountAddress);
      setNativeAsset(nativeAsset);
    };
    !nativeAsset && getNativeAsset();
  }, [nativeAsset, network, accountAddress]);

  return { rainbowFeeNative, rainbowFeePercentage };
}
