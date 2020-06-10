import React from 'react';
import { Platform } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { colors } from '../../styles';
import { Button } from '../buttons';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text as UnstyledText } from '../text';

const BackArrow = styled(Icon).attrs({
  color: colors.appleBlue,
  direction: 'left',
  name: 'caret',
})`
  height: 16;
  margin-top: ${Platform.OS === 'android' ? 2 : 0};
`;

const Container = styled(Row).attrs(({ side }) => ({
  align: 'center',
  justify: side === 'left' ? 'start' : 'end',
}))`
  ${({ side }) => (side === 'left' ? 'left: 0;' : 'right: 0;')}
  background-color: ${colors.transparent};
  bottom: 0;
  padding-left: ${({ side }) => (side === 'left' ? 16 : 48)};
  padding-right: ${({ side }) => (side === 'left' ? 48 : 16)};
  position: absolute;
  top: 0;
  z-index: 2;
`;

const Text = styled(UnstyledText).attrs({
  align: 'center',
  color: colors.appleBlue,
  size: 'large',
  weight: 'medium',
})`
  margin-left: ${({ side }) => (side === 'left' ? 4 : 0)};
`;

const ModalHeaderButton = ({ label, onPress, side }) => (
  <Container
    as={Platform.OS === 'ios' ? BorderlessButton : Button}
    onPress={onPress}
    side={side}
  >
    {side === 'left' && <BackArrow />}
    <Text side={side}>{label}</Text>
  </Container>
);

export default React.memo(ModalHeaderButton);
