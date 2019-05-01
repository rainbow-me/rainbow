import PropTypes from 'prop-types';
import React from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';
import styled from 'styled-components';
import { withNeverRerender } from '../../hoc';
import { colors, position } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { Text } from '../text';

const ButtonIcon = styled(Icon)`
  ${position.maxSize('100%')};
  margin-right: 7;
`;

const Container = styled(Centered)`
  flex: 1;
  height: 56;
`;

const IconContainer = styled(Centered)`
  ${position.size(18)}
  flex-grow: 0;
  flex-shrink: 0;
`;

const ModalFooterButton = ({ icon, label, onPress }) => (
  <Container component={BorderlessButton} onPress={onPress}>
    <IconContainer>
      <ButtonIcon
        color={colors.appleBlue}
        name={icon}
      />
    </IconContainer>
    <Text
      color="white"
      size="large"
      weight="medium"
    >
      {label}
    </Text>
  </Container>
);

ModalFooterButton.propTypes = {
  icon: Icon.propTypes.name,
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default withNeverRerender(ModalFooterButton);
