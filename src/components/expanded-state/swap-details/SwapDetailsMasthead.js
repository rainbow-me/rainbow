import React from 'react';
import { Icon } from '../../icons';
import { RowWithMargins } from '../../layout';
import CurrencyTile, { CurrencyTileHeight } from './CurrencyTile';
import { useSwapCurrencies } from '@rainbow-me/hooks';
import styled from 'styled-components';
import { padding } from '@rainbow-me/styles';

const containerPaddingTop = 34;
export const SwapDetailsMastheadHeight =
  CurrencyTileHeight + containerPaddingTop;

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 7,
})({
  ...padding.object(containerPaddingTop, 24, 0),
  width: '100%',
});

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
}) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const { colors } = useTheme();

  return (
    <Container {...props}>
      <CurrencyTile
        amount={inputAmount}
        amountDisplay={inputAmountDisplay}
        asset={inputCurrency}
        priceValue={inputPriceValue}
        type="input"
      />
      <Icon color={colors.dark} name="doubleChevron" />
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
