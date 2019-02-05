import { pick } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
import { Text } from '../text';

const ButtonSizeTypes = {
  default: {
    fontSize: 'h5',
    padding: [12, 16, 15],
  },
  small: {
    fontSize: 'medium',
    padding: [5.5, 10, 6.5],
  },
};

const ButtonShapeTypes = {
  pill: 'pill',
  rounded: 'rounded',
};

const Container = styled(Centered)`
  ${({ size }) => padding(...ButtonSizeTypes[size].padding)}
  background-color: ${({ bgColor }) => bgColor};
  border-radius: ${({ type }) => ((type === 'rounded') ? 14 : 50)};
  flex-grow: 0;
  position: relative;
  shadow-color: ${colors.blueGreyLight};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 6;
  ${({ containerStyles }) => containerStyles};
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
  <ButtonPressAnimation
    {...pick(props, Object.keys(ButtonPressAnimation.propTypes))}
    onPress={onPress}
  >
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
      {type !== 'pill' && <InnerBorder radius={(type === 'rounded') ? 14 : 50} />}
    </Container>
  </ButtonPressAnimation>
);

Button.propTypes = {
  bgColor: PropTypes.string,
  children: PropTypes.node.isRequired,
  containerStyles: PropTypes.string,
  onPress: PropTypes.func.isRequired,
  size: PropTypes.oneOf(Object.keys(ButtonSizeTypes)),
  style: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  textProps: PropTypes.object,
  type: PropTypes.oneOf(Object.keys(ButtonShapeTypes)),
};

Button.defaultProps = {
  bgColor: colors.grey,
  size: 'default',
  type: ButtonShapeTypes.pill,
};

export default Button;
