import React from 'react';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import { colors_NOT_REACTIVE, padding } from '@rainbow-me/styles';

const Container = styled(Row).attrs({
  align: 'center',
  scaleTo: 0.97,
})`
  ${padding(0, 19)};
  height: 49;
`;

const WalletOption = ({ editMode, label, onPress }) => (
  <Container as={ButtonPressAnimation} disabled={editMode} onPress={onPress}>
    <Text
      color={
        editMode
          ? colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.2)
          : colors_NOT_REACTIVE.appleBlue
      }
      letterSpacing="roundedMedium"
      size="lmedium"
      weight="bold"
    >
      {label}
    </Text>
  </Container>
);

export default React.memo(WalletOption);
