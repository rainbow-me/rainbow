import React from 'react';
import styled from 'styled-components';
import { ColumnWithMargins } from '../../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SwapDetailsContractRow' was resolved to ... Remove this comment to see the full error message
import SwapDetailsContractRow from './SwapDetailsContractRow';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SwapDetailsPriceRow' was resolved to '/U... Remove this comment to see the full error message
import SwapDetailsPriceRow from './SwapDetailsPriceRow';
import SwapDetailsRow, {
  SwapDetailsRowHeight,
  SwapDetailsValue,
  // @ts-expect-error ts-migrate(6142) FIXME: Module './SwapDetailsRow' was resolved to '/Users/... Remove this comment to see the full error message
} from './SwapDetailsRow';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SwapDetailsUniswapRow' was resolved to '... Remove this comment to see the full error message
import SwapDetailsUniswapRow from './SwapDetailsUniswapRow';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useSwapAdjustedAmounts, useSwapCurrencies } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { isETH } from '@rainbow-me/utils';

const contentRowMargin = 24;
export const SwapDetailsContentMinHeight =
  (SwapDetailsRowHeight + contentRowMargin) * 4;

const Container = styled(ColumnWithMargins).attrs({
  flex: 1,
  margin: contentRowMargin,
})`
  ${({ isHighPriceImpact }) => padding(isHighPriceImpact ? 24 : 30, 19, 30)};
`;

export default function SwapDetailsContent({
  isHighPriceImpact,
  onCopySwapDetailsText,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
  tradeDetails,
  ...props
}: any) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const { amountReceivedSold, receivedSoldLabel } = useSwapAdjustedAmounts(
    tradeDetails
  );

  const showPriceImpact =
    (!isHighPriceImpact || priceImpactNativeAmount) &&
    priceImpactPercentDisplay;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      isHighPriceImpact={isHighPriceImpact}
      testID="swap-details-state"
      {...props}
    >
      {showPriceImpact && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SwapDetailsRow label="Price impact">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SwapDetailsValue
            color={priceImpactColor}
            letterSpacing="roundedTight"
          >
            {priceImpactPercentDisplay}
          </SwapDetailsValue>
        </SwapDetailsRow>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SwapDetailsRow label={receivedSoldLabel}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SwapDetailsValue letterSpacing="roundedTight">
          {amountReceivedSold}
        </SwapDetailsValue>
      </SwapDetailsRow>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SwapDetailsPriceRow tradeDetails={tradeDetails} />
      {!isETH(inputCurrency?.address) && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SwapDetailsContractRow
          asset={inputCurrency}
          onCopySwapDetailsText={onCopySwapDetailsText}
        />
      )}
      {!isETH(outputCurrency?.address) && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SwapDetailsContractRow
          asset={outputCurrency}
          onCopySwapDetailsText={onCopySwapDetailsText}
        />
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SwapDetailsUniswapRow />
    </Container>
  );
}
