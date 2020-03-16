import { isArray, isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../../styles';
import InnerBorder from '../../InnerBorder';
import { Centered } from '../../layout';
import { Text } from '../../text';

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

const shadowStyles = `
  shadow-color: ${colors.alpha(colors.blueGreyDark, 0.5)};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 6;
`;

const Container = styled(Centered)`
  ${({ showShadow }) => (showShadow ? shadowStyles : '')}
  ${({ size }) => padding(...ButtonSizeTypes[size].padding)}
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${({ type }) => (type === 'rounded' ? 14 : 50)};
  flex-grow: 0;
`;

const shouldRenderChildrenAsText = children =>
  isArray(children) ? isString(children[0]) : isString(children);

const Button = ({
  backgroundColor,
  borderColor,
  borderOpacity,
  borderWidth,
  children,
  color,
  containerStyles,
  disabled,
  onPress,
  showShadow,
  size,
  style,
  textProps,
  type,
  ...props
}) => (
  <Container
    {...props}
    backgroundColor={backgroundColor}
    css={containerStyles}
    showShadow={showShadow}
    size={size}
    style={style}
    type={type}
  >
    <TouchableOpacity onPress={onPress}>
      {!shouldRenderChildrenAsText(children) ? (
        children
      ) : (
        <Text
          color={color}
          size={ButtonSizeTypes[size].fontSize}
          weight="semibold"
          {...textProps}
        >
          {children}
        </Text>
      )}
      {(!onPress || !disabled) && (
        <InnerBorder
          color={borderColor}
          opacity={borderOpacity}
          radius={type === 'rounded' ? 14 : 50}
          width={borderWidth}
        />
      )}
    </TouchableOpacity>
  </Container>
);

Button.propTypes = {
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  borderOpacity: PropTypes.string,
  borderWidth: PropTypes.number,
  children: PropTypes.node.isRequired,
  color: PropTypes.string,
  containerStyles: PropTypes.string,
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  showShadow: PropTypes.bool,
  size: PropTypes.oneOf(Object.keys(ButtonSizeTypes)),
  style: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  textProps: PropTypes.object,
  type: PropTypes.oneOf(Object.keys(ButtonShapeTypes)),
};

Button.defaultProps = {
  backgroundColor: colors.grey,
  color: colors.white,
  showShadow: true,
  size: 'default',
  type: ButtonShapeTypes.pill,
};

export default Button;
