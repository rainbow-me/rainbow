import { isArray, isString } from 'lodash';
import React from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { Centered, InnerBorder } from '../../layout';
import { Text } from '../../text';
import styled from '@/styled-thing';
import { padding } from '@/styles';

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

const shadowStyles = (colors, disabled, isDarkMode) => ({
  shadowColor: colors.alpha(isDarkMode ? colors.shadow : colors.blueGreyDark, isDarkMode && disabled ? 0.2 : 0.5),
  shadowOffset: { height: 4, width: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
});

const Container = styled(Centered)(({ disabled, backgroundColor, size, showShadow, borderRadius, theme: { colors, isDarkMode } }) => ({
  ...(showShadow ? shadowStyles(colors, disabled, isDarkMode) : {}),

  ...padding.object(...ButtonSizeTypes[size].padding),
  backgroundColor: backgroundColor,

  borderRadius: borderRadius,
  flexGrow: 0,
}));

const shouldRenderChildrenAsText = children => (isArray(children) ? isString(children[0]) : isString(children));

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
  testID,
  ...props
}) {
  const borderRadius = type === 'rounded' ? 14 : 50;
  const { colors, isDarkMode } = useTheme();

  return (
    <ButtonPressAnimation {...props} disabled={disabled} onPress={onPress} testID={testID}>
      <Container
        {...props}
        backgroundColor={backgroundColor || (isDarkMode ? colors.offWhite : colors.grey)}
        borderRadius={borderRadius}
        disabled={disabled}
        showShadow={showShadow}
        size={size}
        style={[containerStyles, style]}
      >
        {shouldRenderChildrenAsText(children) ? (
          <Text color={color || colors.whiteLabel} size={ButtonSizeTypes[size].fontSize} weight="semibold" {...textProps}>
            {children}
          </Text>
        ) : (
          children
        )}
        {(!onPress || !disabled) && <InnerBorder color={borderColor} opacity={borderOpacity} radius={borderRadius} width={borderWidth} />}
      </Container>
    </ButtonPressAnimation>
  );
}
