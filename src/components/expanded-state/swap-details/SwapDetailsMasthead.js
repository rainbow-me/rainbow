import { useRoute } from '@react-navigation/native';
import React from 'react';
import styled from 'styled-components/primitives';
import { Icon } from '../../icons';
import { RowWithMargins } from '../../layout';
import CurrencyTile, { CurrencyTileHeight } from './CurrencyTile';
import { colors, padding } from '@rainbow-me/styles';

const containerPaddingTop = 19;
export const SwapDetailsMastheadHeight =
  CurrencyTileHeight + containerPaddingTop;

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 7,
})`
  ${padding(containerPaddingTop, 24, 0)};
  width: 100%;
`;

export default function SwapDetailsMasthead(props) {
  const {
    params: {
      inputAmount,
      inputCurrency,
      inputPriceValue,
      outputAmount,
      outputCurrency,
      outputPriceValue,
      slippage,
    },
  } = useRoute();

  return (
    <Container {...props}>
      <CurrencyTile
        amount={inputAmount}
        asset={inputCurrency}
        priceValue={inputPriceValue}
        type="input"
      />
      <Icon color={colors.dark} name="doubleChevron" />
      <CurrencyTile
        amount={outputAmount}
        asset={outputCurrency}
        priceValue={outputPriceValue}
        slippage={slippage}
        type="output"
      />
    </Container>
  );
}
