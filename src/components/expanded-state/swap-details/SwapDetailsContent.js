import { ETH_ADDRESS } from '@rainbow-me/swaps';
import React from 'react';
import { useSelector } from 'react-redux';
import { ColumnWithMargins } from '../../layout';
import SwapDetailsContractRow from './SwapDetailsContractRow';
import SwapDetailsPriceRow from './SwapDetailsPriceRow';
import SwapDetailsRow, {
  SwapDetailsRowHeight,
  SwapDetailsValue,
} from './SwapDetailsRow';
import SwapDetailsUniswapRow from './SwapDetailsUniswapRow';
import {
  convertRawAmountToDecimalFormat,
  divide,
  multiply,
  subtract,
} from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useSwapAdjustedAmounts,
  useSwapCurrencies,
} from '@rainbow-me/hooks';
import { SwapModalField } from '@rainbow-me/redux/swap';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';
import { ethereumUtils, isETH } from '@rainbow-me/utils';

const contentRowMargin = 24;
export const SwapDetailsContentMinHeight =
  (SwapDetailsRowHeight + contentRowMargin) * 4;

const Container = styled(ColumnWithMargins).attrs({
  flex: 1,
  margin: contentRowMargin,
})(({ isHighPriceImpact }) =>
  padding.object(isHighPriceImpact ? 24 : 30, 19, 30)
);

export default function SwapDetailsContent({
  isHighPriceImpact,
  onCopySwapDetailsText,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
  tradeDetails,
  ...props
}) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const { amountReceivedSold, receivedSoldLabel } = useSwapAdjustedAmounts(
    tradeDetails
  );
  const inputAsExact = useSelector(
    state => state.swap.independentField !== SwapModalField.output
  );

  const showPriceImpact =
    (!isHighPriceImpact || priceImpactNativeAmount) &&
    priceImpactPercentDisplay;

  const { nativeCurrencySymbol } = useAccountSettings();

  const feeNativeCurrency = useMemo(() => {
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

        return (Number(feeInOutputToken) * priceOfEth).toFixed(2);
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
    inputCurrency,
    tradeDetails.buyAmount,
    tradeDetails.buyTokenAddress,
    tradeDetails.feePercentageBasisPoints,
    tradeDetails.sellAmount,
    tradeDetails.sellAmountMinusFees,
  ]);

  // logger.debug('tradeDetails', JSON.stringify(tradeDetails, null, 2));
  // logger.debug('fee in native currency', feeNativeCurrency);
  // logger.debug('inputCurrency', inputCurrency);
  // logger.debug('outputCurrency', outputCurrency);

  return (
    <Container
      isHighPriceImpact={isHighPriceImpact}
      testID="swap-details-state"
      {...props}
    >
      {showPriceImpact && (
        <SwapDetailsRow label="Price impact">
          <SwapDetailsValue
            color={priceImpactColor}
            letterSpacing="roundedTight"
          >
            {priceImpactPercentDisplay}
          </SwapDetailsValue>
        </SwapDetailsRow>
      )}
      <SwapDetailsRow label="Rainbow fee">
        <SwapDetailsValue letterSpacing="roundedTight">
          {nativeCurrencySymbol}
          {feeNativeCurrency}
        </SwapDetailsValue>
      </SwapDetailsRow>
      <SwapDetailsRow label={receivedSoldLabel}>
        <SwapDetailsValue letterSpacing="roundedTight">
          {amountReceivedSold}{' '}
          {inputAsExact ? outputCurrency.symbol : inputCurrency.symbol}
        </SwapDetailsValue>
      </SwapDetailsRow>
      <SwapDetailsPriceRow tradeDetails={tradeDetails} />
      {!isETH(inputCurrency?.address) && (
        <SwapDetailsContractRow
          asset={inputCurrency}
          onCopySwapDetailsText={onCopySwapDetailsText}
        />
      )}
      {!isETH(outputCurrency?.address) && (
        <SwapDetailsContractRow
          asset={outputCurrency}
          onCopySwapDetailsText={onCopySwapDetailsText}
        />
      )}
      <SwapDetailsUniswapRow protocols={tradeDetails?.protocols} />
    </Container>
  );
}
