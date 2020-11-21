import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import { colors, padding } from '@rainbow-me/styles';

const Container = styled(ButtonPressAnimation)`
  margin-right: 4;
`;

const MaxButtonContent = styled(Row).attrs({
  align: 'center',
})`
  ${padding(0, 19)};
  height: 32;
`;

const MaxButtonLabel = styled(Text).attrs({
  align: 'center',
  size: 'lmedium',
  weight: 'bold',
})`
  margin-top: 3;
`;

export default function ExchangeMaxButton({
  color = colors.appleBlue,
  disabled,
  onPress,
  testID,
}) {
  return (
    <Container disabled={disabled} onPress={onPress} testID={testID}>
      <MaxButtonContent>
        <MaxButtonLabel color={color}>􀜍 Max</MaxButtonLabel>
      </MaxButtonContent>
    </Container>
  );
}
