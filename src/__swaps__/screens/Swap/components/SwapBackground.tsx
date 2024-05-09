import React from 'react';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { useColorMode } from '@/design-system';
import { useDimensions } from '@/hooks';
import { ETH_COLOR, ETH_COLOR_DARK } from '@/__swaps__/screens/Swap/constants';
import { getColorValueForThemeWorklet, getTintedBackgroundColor } from '@/__swaps__/utils/swaps';
import { IS_ANDROID } from '@/env';
import { navbarHeight } from '@/components/navbar/Navbar';
import { safeAreaInsetValues } from '@/utils';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const SwapBackground = () => {
  const { internalSelectedInputAsset } = useSwapContext();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { isDarkMode } = useColorMode();

  const fallbackColor = isDarkMode ? ETH_COLOR_DARK : ETH_COLOR;

  const bottomColorDarkened = useSharedValue(getTintedBackgroundColor(fallbackColor)[isDarkMode ? 'dark' : 'light']);
  const topColorDarkened = useSharedValue(getTintedBackgroundColor(fallbackColor)[isDarkMode ? 'dark' : 'light']);

  const backgroundStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(internalSelectedInputAsset.value?.color, isDarkMode, true),
      position: 'absolute',
      zIndex: -10,
      borderRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
      height: deviceHeight + (IS_ANDROID ? 24 : 0),
      paddingTop: safeAreaInsetValues.top + (navbarHeight - 12),
      width: deviceWidth,
      alignItems: 'center',
      justifyContent: 'center',
    };
  });

  return (
    <AnimatedLinearGradient
      colors={[topColorDarkened.value, bottomColorDarkened.value]}
      style={backgroundStyles}
      end={{ x: 0.5, y: 1 }}
      start={{ x: 0.5, y: 0 }}
    />
  );
};
