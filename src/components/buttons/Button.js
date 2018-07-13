import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding, position, shadow } from '../../styles';
import { Text } from '../text';
import ButtonPressAnimation from './ButtonPressAnimation';

const Container = styled.View`
  ${padding(12, 16, 15)}
  background-color: ${colors.grey};
  border-radius: 50;
  flex-grow: 0;
`;

const Button = ({ children, onPress, ...props }) => (
  <ButtonPressAnimation onPress={onPress}>
    <Container {...props}>
      <Text
        color="white"
        size="h5"
        weight="semibold"
      >
        {children}
      </Text>
    </Container>
  </ButtonPressAnimation>
);

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func.isRequired,
};

export default Button;
