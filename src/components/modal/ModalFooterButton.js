import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';
import { colors, position } from '@rainbow-me/styles';

const ButtonIcon = styled(Icon)`
  ${position.maxSize('100%')};
  margin-right: 9;
`;

const Container = styled(Centered)`
  flex: 1;
  height: 56;
  padding-bottom: 7;
`;

const IconContainer = styled(Centered).attrs({
  grow: 0,
  shrink: 0,
})`
  ${position.size(18)};
`;

const ModalFooterButton = ({ icon, label, onPress }) => (
  <Container as={BorderlessButton} onPress={onPress}>
    <IconContainer>
      <ButtonIcon color={colors.appleBlue} name={icon} />
    </IconContainer>
    <Text color="appleBlue" size="large" weight="semibold">
      {label}
    </Text>
  </Container>
);

export default React.memo(ModalFooterButton);
