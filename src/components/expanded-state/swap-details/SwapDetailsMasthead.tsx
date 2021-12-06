import React from 'react';
import styled from 'styled-components';
import { Icon } from '../../icons';
import { RowWithMargins } from '../../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CurrencyTile' was resolved to '/Users/ni... Remove this comment to see the full error message
import CurrencyTile, { CurrencyTileHeight } from './CurrencyTile';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useSwapCurrencies } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const containerPaddingTop = 34;
export const SwapDetailsMastheadHeight =
  CurrencyTileHeight + containerPaddingTop;

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 7,
})`
  ${padding(containerPaddingTop, 24, 0)};
  width: 100%;
`;

export default function SwapDetailsMasthead({
  inputAmount,
  inputAmountDisplay,
  inputPriceValue,
  isHighPriceImpact,
  outputAmount,
  outputAmountDisplay,
  outputPriceValue,
  priceImpactColor,
  ...props
}: any) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container {...props}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CurrencyTile
        amount={inputAmount}
        amountDisplay={inputAmountDisplay}
        asset={inputCurrency}
        priceValue={inputPriceValue}
        type="input"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Icon color={colors.dark} name="doubleChevron" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <CurrencyTile
        amount={outputAmount}
        amountDisplay={outputAmountDisplay}
        asset={outputCurrency}
        isHighPriceImpact={isHighPriceImpact}
        priceImpactColor={priceImpactColor}
        priceValue={outputPriceValue}
        type="output"
      />
    </Container>
  );
}
