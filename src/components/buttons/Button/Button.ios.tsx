import { isArray, isString, pick } from 'lodash';
import React from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../../context/ThemeContext' was resolve... Remove this comment to see the full error message
import { useTheme } from '../../../context/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { Centered, InnerBorder } from '../../layout';
import { Text } from '../../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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

const shadowStyles = (colors: any, disabled: any, isDarkMode: any) => `
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
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  ${({ size }) => padding(...ButtonSizeTypes[size].padding)}
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${({ borderRadius }) => borderRadius};
  flex-grow: 0;
`;

const shouldRenderChildrenAsText = (children: any) =>
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
}: any) {
  const borderRadius = type === 'rounded' ? 14 : 50;
  const { colors, isDarkMode } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      {...pick(props, Object.keys(ButtonPressAnimation.propTypes))}
      disabled={disabled}
      onPress={onPress}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Text
            color={color || colors.whiteLabel}
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
