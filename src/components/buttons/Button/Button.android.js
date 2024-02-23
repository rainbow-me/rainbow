import { isArray, isString } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { Centered, InnerBorder } from '../../layout';
import { Text } from '../../text';
import styled from '@/styled-thing';
import { padding } from '@/styles';

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

const shadowStyles = (colors, disabled, isDarkMode) => ({
  shadowColor: colors.alpha(isDarkMode ? colors.shadow : colors.blueGreyDark, isDarkMode && disabled ? 0.2 : 0.5),
  shadowOffset: { height: 4, width: 0 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
});

const Container = styled(Centered)(({ disabled, type, showShadow, backgroundColor, size, theme: { colors, isDarkMode } }) => ({
  ...(showShadow ? shadowStyles(colors, disabled, isDarkMode) : {}),
  ...padding.object(...ButtonSizeTypes[size].padding),
  backgroundColor: backgroundColor,
  borderRadius: type === 'rounded' ? 14 : 50,
  flexGrow: 0,
}));

const shouldRenderChildrenAsText = children => (isArray(children) ? isString(children[0]) : isString(children));

const Button = ({
  backgroundColor,
  children,
  color,
  containerStyles,
  onPress,
  showShadow,
  size,
  style,
  textProps,
  type,
  borderColor,
  borderOpacity,
  borderWidth,
  disabled,
  testID,
  ...props
}) => {
  const borderRadius = type === 'rounded' ? 14 : 50;
  const { colors, isDarkMode } = useTheme();

  return (
    <ButtonPressAnimation disabled={disabled} onPress={onPress} radiusAndroid={borderRadius} testID={testID}>
      <Container
        {...props}
        backgroundColor={backgroundColor || (isDarkMode ? colors.offWhite : colors.grey)}
        disabled={disabled}
        showShadow={showShadow}
        size={size}
        style={[containerStyles, style]}
        type={type}
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
};

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
  showShadow: true,
  size: 'default',
  type: ButtonShapeTypes.pill,
};

export default Button;
