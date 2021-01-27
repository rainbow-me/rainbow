import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { darkModeThemeColors, lightModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';
import { padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = darkMode => ({
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
});

const shadowLight = shadowsFactory(false);
const shadowsDark = shadowsFactory(true);

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})`
  ${({ hasLeadingIcon }) => padding(0, 10, 1, hasLeadingIcon ? 6 : 10)};
  border-radius: 15px;
  height: 30;
  z-index: 1;
`;

export default function MiniButton({
  borderRadius = 15,
  children,
  disabled,
  hasLeadingIcon,
  onPress,
  scaleTo = 0.82,
  width,
  height,
  ...props
}) {
  const { isDarkMode, colors } = useTheme();

  const shadows = isDarkMode ? shadowsDark : shadowLight;

  return (
    <ButtonPressAnimation
      disabled={disabled}
      onPress={onPress}
      opacity={isDarkMode && disabled ? 0.6 : 1}
      radiusAndroid={borderRadius}
      scaleTo={scaleTo}
      {...props}
    >
      <View style={{ borderRadius }}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={disabled ? colors.lightGrey : colors.appleBlue}
          borderRadius={borderRadius}
          height={height}
          shadows={disabled ? shadows.disabled : shadows.default}
          width={width}
        />
        <Content hasLeadingIcon={hasLeadingIcon}>
          {typeof children === 'string' ? (
            <Text align="center" color="whiteLabel" weight="bold">
              {children}
            </Text>
          ) : (
            children
          )}
        </Content>
        <InnerBorder radius={borderRadius} />
      </View>
    </ButtonPressAnimation>
  );
}
