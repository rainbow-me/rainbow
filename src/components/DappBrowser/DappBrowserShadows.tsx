import React from 'react';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { StyleSheet } from 'react-native';

export const BrowserButtonShadows = ({ children, lightShadows }: { children: React.ReactNode; lightShadows?: boolean }) => {
  const { isDarkMode } = useColorMode();

  if (!IS_IOS) return <>{children}</>;

  return (
    <Box
      style={{
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: 8 },
        // eslint-disable-next-line no-nested-ternary
        shadowOpacity: isDarkMode ? 0.3 : lightShadows ? 0.06 : 0.08,
        shadowRadius: 12,
      }}
    >
      <Box
        style={{
          shadowColor: globalColors.grey100,
          shadowOffset: { width: 0, height: 2 },
          // eslint-disable-next-line no-nested-ternary
          shadowOpacity: isDarkMode ? 0.2 : lightShadows ? 0.02 : 0.04,
          shadowRadius: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export const WebViewShadows = ({
  children,
  gestureScale,
  isOnHomepage,
  tabIndex,
  animatedActiveTabIndex,
  tabViewProgress,
}: {
  children: React.ReactNode;
  gestureScale: SharedValue<number>;
  isOnHomepage: boolean;
  tabIndex: number;
  animatedActiveTabIndex: SharedValue<number> | undefined;
  tabViewProgress: SharedValue<number> | undefined;
}) => {
  const { isDarkMode } = useColorMode();

  const innerShadowOpacityOverride = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value ?? 0;
    return {
      ...(IS_IOS && isOnHomepage && !isDarkMode
        ? {
            shadowOpacity: (progress / 100) * 0.04,
          }
        : {}),
    };
  });

  const outerShadowOpacityOverride = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value ?? 0;
    const isActiveTabAnimated = animatedActiveTabIndex?.value === tabIndex;

    return {
      ...(IS_IOS && isOnHomepage && !isDarkMode
        ? {
            shadowOpacity: (progress / 100) * 0.1,
          }
        : {}),
      zIndex: gestureScale.value * (isActiveTabAnimated || gestureScale.value > 1 ? 9999 : 1),
    };
  });

  if (!IS_IOS)
    return (
      <Box as={Animated.View} style={outerShadowOpacityOverride}>
        {children}
      </Box>
    );

  return (
    <Box
      as={Animated.View}
      style={[
        {
          shadowColor: globalColors.grey100,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 12,
        },
        isDarkMode ? styles.darkBackground : styles.lightBackground,
        outerShadowOpacityOverride,
      ]}
    >
      <Box
        as={Animated.View}
        style={[
          {
            shadowColor: globalColors.grey100,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.2 : 0.04,
            shadowRadius: 3,
          },
          isDarkMode ? styles.darkBackground : styles.lightBackground,
          innerShadowOpacityOverride,
        ]}
      >
        {children}
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  darkBackground: {
    backgroundColor: globalColors.grey100,
  },
  lightBackground: {
    backgroundColor: '#FBFCFD',
  },
});
