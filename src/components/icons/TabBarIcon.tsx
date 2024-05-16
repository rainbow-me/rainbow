/* eslint-disable no-nested-ternary */
import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, SharedValue, AnimatedStyle } from 'react-native-reanimated';
import { Box, Cover, useColorMode } from '@/design-system';
import { globalColors } from '@/design-system/color/palettes';
import { Icon } from '@/components/icons';
import { useTheme } from '@/theme';

type TabBarIconProps = {
  accentColor: string;
  icon: string;
  index: number;
  reanimatedPosition: SharedValue<number>;
  hideShadow?: boolean;
  size?: number;
  tintBackdrop?: string;
  tintOpacity?: number;
};

export function TabBarIcon({ accentColor, hideShadow, icon, index, reanimatedPosition, size, tintBackdrop, tintOpacity }: TabBarIconProps) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  const hasTransparentInnerFill = icon === 'tabDiscover' || icon === 'tabPoints' || icon === 'tabDappBrowser';

  const outlineColor = isDarkMode ? globalColors.blueGrey60 : globalColors.blueGrey70;

  const iconColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      reanimatedPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [outlineColor, accentColor, accentColor, accentColor, outlineColor]
    );

    return {
      backgroundColor,
    };
  });

  const iconShadow = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      reanimatedPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [0, 0.2, 0.2, 0.2, 0]
    );

    return {
      shadowColor: isDarkMode ? colors.shadowBlack : accentColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity,
      shadowRadius: 3,
    };
  });

  const iconShadowBlack = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      reanimatedPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [0, 0.02, 0.02, 0.02, 0]
    );

    return {
      shadowColor: colors.shadowBlack,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity,
      shadowRadius: 3,
    };
  });

  const innerFillColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      reanimatedPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [
        isDarkMode ? outlineColor : '#FEFEFE',
        tintBackdrop || (hasTransparentInnerFill ? (isDarkMode ? '#171819' : '#FEFEFE') : accentColor),
        tintBackdrop || (hasTransparentInnerFill ? (isDarkMode ? '#171819' : '#FEFEFE') : accentColor),
        tintBackdrop || (hasTransparentInnerFill ? (isDarkMode ? '#171819' : '#FEFEFE') : accentColor),
        isDarkMode ? outlineColor : '#FEFEFE',
      ]
    );
    const opacity = interpolate(reanimatedPosition.value, [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7], [0, 1, 1, 1, 0]);

    return {
      backgroundColor,
      opacity,
    };
  });

  const discoverTabInnerFillColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      reanimatedPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [
        accentColor ?? colors.appleBlue,
        accentColor ?? colors.appleBlue,
        accentColor ?? colors.appleBlue,
        accentColor ?? colors.appleBlue,
        accentColor ?? colors.appleBlue,
      ]
    );
    const opacity = interpolate(
      reanimatedPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [0, tintOpacity ?? 0.25, tintOpacity ?? 0.25, tintOpacity ?? 0.25, 0]
    );

    return {
      backgroundColor,
      opacity,
    };
  });

  const innerIconColor = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      reanimatedPosition.value,
      [index - 0.7, index - 0.3, index, index + 0.3, index + 0.7],
      [
        outlineColor,
        isDarkMode ? '#171819' : '#FEFEFE',
        isDarkMode ? '#171819' : '#FEFEFE',
        isDarkMode ? '#171819' : '#FEFEFE',
        outlineColor,
      ]
    );
    // const opacity = interpolate(
    //   scrollPosition.value,
    //   [index - 1, index, index + 1],
    //   [0, 1, 0]
    // );
    // const scale = interpolate(
    //   scrollPosition.value,
    //   [index - 1, index, index + 1],
    //   [0.25, 1, 0.25]
    // );

    return {
      backgroundColor,
      // opacity,
      // transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={hideShadow ? undefined : iconShadowBlack}>
      <Animated.View style={hideShadow ? undefined : iconShadow}>
        <TabBarIconContent
          discoverTabInnerFillColor={discoverTabInnerFillColor}
          hasTransparentInnerFill={hasTransparentInnerFill}
          icon={icon}
          iconColor={iconColor}
          innerFillColor={innerFillColor}
          innerIconColor={innerIconColor}
          size={size}
        />
      </Animated.View>
    </Animated.View>
  );
}

const TabBarIconContent = React.memo(function TabBarIconContent({
  discoverTabInnerFillColor,
  hasTransparentInnerFill,
  icon,
  iconColor,
  innerFillColor,
  innerIconColor,
  size,
}: {
  discoverTabInnerFillColor: AnimatedStyle;
  hasTransparentInnerFill: boolean;
  icon: string;
  iconColor: AnimatedStyle;
  innerFillColor: AnimatedStyle;
  innerIconColor: AnimatedStyle;
  size: number | undefined;
}) {
  return (
    <Box height={{ custom: size || 28 }} width={{ custom: size || 28 }}>
      <Cover alignHorizontal="center" alignVertical="center">
        <MaskedView maskElement={<Icon name={icon + 'InnerFill'} size={size} />}>
          <Box as={Animated.View} height={{ custom: size || 28 }} style={innerFillColor} width={{ custom: size || 28 }}>
            {hasTransparentInnerFill && <Box as={Animated.View} height="full" style={discoverTabInnerFillColor} width="full" />}
          </Box>
        </MaskedView>
      </Cover>
      <Cover alignHorizontal="center" alignVertical="center">
        <MaskedView maskElement={<Icon name={icon} size={size} />}>
          <Box as={Animated.View} height={{ custom: size || 28 }} style={iconColor} width={{ custom: size || 28 }} />
        </MaskedView>
      </Cover>
      {!hasTransparentInnerFill && (
        <Cover alignHorizontal="center" alignVertical="center">
          <MaskedView maskElement={<Icon name={icon + 'Inner'} size={size} />}>
            <Box as={Animated.View} height={{ custom: size || 28 }} style={innerIconColor} width={{ custom: size || 28 }}>
              <Box as={Animated.View} height="full" style={[iconColor, { opacity: 0.25 }]} width="full" />
            </Box>
          </MaskedView>
        </Cover>
      )}
    </Box>
  );
});
