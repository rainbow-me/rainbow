import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
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

const Container = styled(Centered)`
  ${({ size }) => padding(...ButtonSizeTypes[size].padding)}
  background-color: ${({ bgColor }) => (bgColor || colors.grey)};
  border-radius: ${({ type }) => ((type === 'rounded') ? 14 : 50)};
  flex-grow: 0;
  ${({ containerStyles }) => containerStyles}
`;

const Button = ({
  children,
  containerStyles,
  onPress,
  size,
  style,
  textProps,
  type,
  ...props
}) => (
  <ButtonPressAnimation onPress={onPress}>
    <Container
      {...props}
      containerStyles={containerStyles}
      size={size}
      style={style}
      type={type}
    >
      <Text
        color="white"
        size={ButtonSizeTypes[size].fontSize}
        weight="semibold"
        {...textProps}
      >
        {children}
      </Text>
      <InnerBorder radius={(type === 'rounded') ? 14 : 50} />
    </Container>
  </ButtonPressAnimation>
);

Button.propTypes = {
  children: PropTypes.node.isRequired,
  containerStyles: PropTypes.string,
  onPress: PropTypes.func.isRequired,
  size: PropTypes.oneOf(Object.keys(ButtonSizeTypes)),
  style: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  textProps: PropTypes.object,
  type: PropTypes.oneOf(Object.keys(ButtonShapeTypes)),
};

Button.defaultProps = {
  size: 'default',
  type: ButtonShapeTypes.pill,
};

export default Button;
