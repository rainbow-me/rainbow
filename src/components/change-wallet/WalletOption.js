import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';

const Container = styled(Row).attrs({
  align: 'center',
  scaleTo: 0.98,
})`
  ${padding(15, 19)};
`;

const WalletOption = ({ editMode, label, onPress }) => (
  <Container as={ButtonPressAnimation} disabled={editMode} onPress={onPress}>
    <Text
      color={
        editMode ? colors.alpha(colors.blueGreyDark, 0.2) : colors.appleBlue
      }
      letterSpacing="roundedMedium"
      size="lmedium"
      weight="semibold"
    >
      {label}
    </Text>
  </Container>
);

export default React.memo(WalletOption);
