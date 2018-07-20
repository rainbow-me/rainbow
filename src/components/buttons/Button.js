import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding, position } from '../../styles';
import { Text } from '../text';
import ButtonPressAnimation from './ButtonPressAnimation';

const ButtonSizeTypes = {
  small: {
    fontSize: 'medium',
    padding: [5.5, 10, 6.5],
  },
  default: {
    fontSize: 'h5',
    padding: [12, 16, 15],
  },
};

const ButtonShapeTypes = {
  pill: 'pill',
  rounded: 'rounded',
};

const Container = styled.View`
  ${({ size }) => padding(...ButtonSizeTypes[size].padding)}
  background-color: ${({ bgColor }) => (bgColor || colors.grey)};
  border-radius: ${({ type }) => ((type === 'rounded') ? 14 : 50)};
  flex-grow: 0;
`;

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${colors.alpha(colors.black, 0.06)};
  border-radius: ${({ type }) => ((type === 'rounded') ? 14 : 50)};
  border-width: 0.5;
`;

const Button = ({
  children,
  onPress,
  size,
  textProps,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPress}>
    <Container {...props} size={size}>
      <Text
        color="white"
        size={ButtonSizeTypes[size].fontSize}
        weight="semibold"
        {...textProps}
      >
        {children}
      </Text>
      <InnerBorder {...props} />
    </Container>
  </ButtonPressAnimation>
);

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onPress: PropTypes.func.isRequired,
  size: PropTypes.oneOf(Object.keys(ButtonSizeTypes)),
  textProps: PropTypes.object,
  type: PropTypes.oneOf(Object.keys(ButtonShapeTypes)),
};

Button.defaultProps = {
  size: 'default',
  type: ButtonShapeTypes.pill,
};

export default Button;
