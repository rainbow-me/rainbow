import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { darkModeThemeColors, lightModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = (darkMode: any) => ({
  default: [
    [
      0,
      4,
      12,
      darkMode ? darkModeThemeColors.shadow : lightModeThemeColors.appleBlue,
      0.4,
    ],
  ],

  disabled: [
    [
      0,
      4,
      12,
      darkMode ? darkModeThemeColors.lightGrey : lightModeThemeColors.lightGrey,
      darkMode ? 0 : 0.4,
    ],
  ],

  none: [[0, 0, 0, lightModeThemeColors.transparent, 0]],
});

const shadowLight = shadowsFactory(false);
const shadowsDark = shadowsFactory(true);

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})`
  ${({ hasLeadingIcon, small }) =>
    padding(0, small ? 8 : 10, 0, hasLeadingIcon ? 6 : small ? 8 : 10)};
  border-radius: 15px;
  height: ${({ small }) => (small ? 27 : 30)};
  z-index: 1;
`;

export default function MiniButton({
  backgroundColor,
  borderRadius = 15,
  children,
  color,
  disabled,
  hasLeadingIcon,
  height,
  hideShadow,
  letterSpacing,
  onPress,
  scaleTo = 0.82,
  small,
  weight,
  width,
  ...props
}: any) {
  const { isDarkMode, colors } = useTheme();

  const shadows = isDarkMode ? shadowsDark : shadowLight;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      disabled={disabled}
      onPress={onPress}
      opacity={isDarkMode && disabled ? 0.6 : 1}
      radiusAndroid={borderRadius}
      scaleTo={scaleTo}
      {...props}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View style={{ borderRadius }}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            android
              ? 'none'
              : disabled
              ? colors.lightGrey
              : backgroundColor || colors.appleBlue
          }
          borderRadius={borderRadius}
          height={height}
          shadows={
            hideShadow
              ? shadows.none
              : disabled
              ? shadows.disabled
              : shadows.default
          }
          width={width}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Content
          backgroundColor={
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            android
              ? disabled
                ? colors.lightGrey
                : backgroundColor || colors.appleBlue
              : 'none'
          }
          hasLeadingIcon={hasLeadingIcon}
          small={small}
        >
          {typeof children === 'string' ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <Text
              align="center"
              color={color || colors.whiteLabel}
              letterSpacing={letterSpacing}
              // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
              lineHeight={android ? 19 : null}
              weight={weight || 'bold'}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </Content>
      </View>
    </ButtonPressAnimation>
  );
}
