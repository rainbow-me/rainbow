import { isArray, isString, pick } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../../context/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { Centered, InnerBorder } from '../../layout';
import { Text } from '../../text';
import { padding } from '@rainbow-me/styles';

const ButtonSizeTypes = {
  default: {
    fontSize: 'large',
    padding: [12, 15, 16],
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

const shadowStyles = (colors, disabled, isDarkMode) => `
  shadow-color: ${colors.alpha(
    isDarkMode ? colors.shadow : colors.blueGreyDark,
    isDarkMode && disabled ? 0.2 : 0.5
  )};
  shadow-offset: 0px 4px;
  shadow-opacity: 0.2;
  shadow-radius: 6;
`;

const Container = styled(Centered)`
  ${({ disabled, showShadow, theme: { colors, isDarkMode } }) =>
    showShadow ? shadowStyles(colors, disabled, isDarkMode) : ''}
  ${({ size }) => padding(...ButtonSizeTypes[size].padding)}
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${({ borderRadius }) => borderRadius};
  flex-grow: 0;
`;

const shouldRenderChildrenAsText = children =>
  isArray(children) ? isString(children[0]) : isString(children);

export default function Button({
  backgroundColor,
  borderColor,
  borderOpacity,
  borderWidth,
  children,
  color,
  containerStyles,
  disabled,
  onPress,
  showShadow = true,
  size = 'default',
  style,
  textProps,
  type = ButtonShapeTypes.pill,
  ...props
}) {
  const borderRadius = type === 'rounded' ? 14 : 50;
  const { colors, isDarkMode } = useTheme();

  return (
    <ButtonPressAnimation
      {...pick(props, Object.keys(ButtonPressAnimation.propTypes))}
      disabled={disabled}
      onPress={onPress}
    >
      <Container
        {...props}
        backgroundColor={
          backgroundColor || (isDarkMode ? colors.offWhite : colors.grey)
        }
        borderRadius={borderRadius}
        css={containerStyles}
        disabled={disabled}
        showShadow={showShadow}
        size={size}
        style={style}
      >
        {shouldRenderChildrenAsText(children) ? (
          <Text
            color={color || colors.whiteLabel}
            size={ButtonSizeTypes[size].fontSize}
            weight="semibold"
            {...textProps}
          >
            {children}
          </Text>
        ) : (
          children
        )}
        {(!onPress || !disabled) && (
          <InnerBorder
            color={borderColor}
            opacity={borderOpacity}
            radius={borderRadius}
            width={borderWidth}
          />
        )}
      </Container>
    </ButtonPressAnimation>
  );
}
