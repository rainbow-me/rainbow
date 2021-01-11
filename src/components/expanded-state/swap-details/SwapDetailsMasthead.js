import React, { useContext } from 'react';
import styled from 'styled-components/primitives';
import { Icon } from '../../icons';
import { RowWithMargins } from '../../layout';
import CurrencyTile from './CurrencyTile';
import SwapDetailsContext from './SwapDetailsContext';
import { colors, padding } from '@rainbow-me/styles';

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 7,
})`
  ${padding(34, 24, 0)};
  width: 100%;
`;

export default function SwapDetailsMasthead(props) {
  const {
    inputAmountDisplay,
    inputCurrency,
    isHighSlippage,
    outputAmountDisplay,
    outputCurrency,
  } = useContext(SwapDetailsContext);

  return (
    <Container {...props}>
      <CurrencyTile
        amountDisplay={inputAmountDisplay}
        asset={inputCurrency}
        type="input"
      />
      <Icon color={colors.dark} name="doubleChevron" />
      <CurrencyTile
        amountDisplay={outputAmountDisplay}
        asset={outputCurrency}
        isHighSlippage={isHighSlippage}
        type="output"
      />
    </Container>
  );
}
