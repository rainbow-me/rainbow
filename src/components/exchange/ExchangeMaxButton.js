import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const MaxButtonLabel = styled(Text).attrs({
  align: 'center',
  color: 'appleBlue',
  size: 'lmedium',
  weight: 'bold',
})`
  margin-top: 3;
`;

export default function ExchangeMaxButton({ disabled, onPress }) {
  return (
    <ButtonPressAnimation disabled={disabled} marginRight={4} onPress={onPress}>
      <RowWithMargins
        align="center"
        height={32}
        margin={0}
        paddingHorizontal={19}
      >
        <MaxButtonLabel>􀜍 Max</MaxButtonLabel>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
}
