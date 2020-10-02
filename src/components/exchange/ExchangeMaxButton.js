import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import { Emoji, Text } from '../text';

const MaxButtonEmoji = styled(Emoji).attrs({
  lineHeight: 'none',
  name: 'moneybag',
  size: 'lmedium',
})`
  margin-top: 0.5;
`;

const MaxButtonLabel = styled(Text).attrs({
  align: 'center',
  color: 'appleBlue',
  size: 'lmedium',
  weight: 'semibold',
})`
  margin-top: 1;
`;

export default function ExchangeMaxButton({ disabled, onPress }) {
  return (
    <ButtonPressAnimation disabled={disabled} marginRight={4} onPress={onPress}>
      <RowWithMargins
        align="center"
        height={32}
        margin={0}
        paddingHorizontal={15}
      >
        <MaxButtonEmoji />
        <MaxButtonLabel>Max</MaxButtonLabel>
      </RowWithMargins>
    </ButtonPressAnimation>
  );
}
