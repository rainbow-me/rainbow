import React from 'react';
import styled from 'styled-components';
import { Icon } from '../../icons';
import { RowWithMargins } from '../../layout';
import CurrencyTile, { CurrencyTileHeight } from './CurrencyTile';
import {
  useSwapDerivedOutputs,
  useSwapInputOutputTokens,
} from '@rainbow-me/hooks';
import { SwapModalField } from '@rainbow-me/redux/swap';
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

export default function SwapDetailsMasthead(props) {
  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();
  const { derivedValues } = useSwapDerivedOutputs();
  const inputAmount = derivedValues[SwapModalField.input];
  const outputAmount = derivedValues[SwapModalField.output];
  const { colors } = useTheme();

  return (
    <Container {...props}>
      <CurrencyTile amount={inputAmount} asset={inputCurrency} type="input" />
      <Icon color={colors.dark} name="doubleChevron" />
      <CurrencyTile
        amount={outputAmount}
        asset={outputCurrency}
        type="output"
      />
    </Container>
  );
}
