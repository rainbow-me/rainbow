import React from 'react';
import { Icon } from '../../icons';
import { RowWithMargins } from '../../layout';
import CurrencyTile, { CurrencyTileHeight } from './CurrencyTile';
import { Bleed, Box } from '@rainbow-me/design-system';
import { useSwapCurrencies } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const containerPaddingTop = 34;
export const SwapDetailsMastheadHeight =
  CurrencyTileHeight + containerPaddingTop;

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 0,
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
      <Bleed space="15px">
        <Box
          background="body"
          borderRadius={36}
          padding="12px"
          shadow="30px heavy body"
        >
          <Icon color={colors.blueGreyDark} name="doubleChevron" />
        </Box>
      </Bleed>

      <CurrencyTile
        amount={outputAmount}
        amountDisplay={outputAmountDisplay}
        asset={outputCurrency}
        isHighPriceImpact={isHighPriceImpact}
        priceImpactColor={priceImpactColor}
        priceValue={outputPriceValue}
        style={{ zIndex: -1 }}
        type="output"
      />
    </Container>
  );
}
