import PropTypes from 'prop-types';
import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { colors, position } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';

const ButtonIcon = styled(Icon)`
  ${position.maxSize('100%')};
  margin-right: 9;
`;

const Container = styled(BorderlessButton)`
  ${position.centered};
  flex-direction: row;
  flex: 1;
  height: 56;
  padding-bottom: 7;
`;

const IconContainer = styled(Centered).attrs({ grow: 0, shrink: 0 })`
  ${position.size(18)};
`;

const ModalFooterButton = ({ icon, label, onPress }) => (
  <Container onPress={onPress}>
    <IconContainer>
      <ButtonIcon color={colors.appleBlue} name={icon} />
    </IconContainer>
    <Text color="appleBlue" size="large" weight="semibold">
      {label}
    </Text>
  </Container>
);

ModalFooterButton.propTypes = {
  icon: Icon.propTypes.name,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default React.memo(ModalFooterButton);
