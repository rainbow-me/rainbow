import React from 'react';
import { useColorMode } from '@/design-system';
import LinearGradient from 'react-native-linear-gradient';
import { useDimensions } from '@/hooks';
import { ETH_COLOR, ETH_COLOR_DARK } from '../constants';
import { getTintedBackgroundColor } from '../utils/swaps';
import { IS_ANDROID } from '@/env';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import { navbarHeight } from '@/components/navbar/Navbar';
import { safeAreaInsetValues } from '@/utils';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSwapContext } from '../providers/swap-provider';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const SwapBackground = () => {
  const { SwapInputController } = useSwapContext();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { isDarkMode } = useColorMode();

  const fallbackColor = isDarkMode ? ETH_COLOR_DARK : ETH_COLOR;

  const bottomColorDarkened = useSharedValue(getTintedBackgroundColor(fallbackColor, isDarkMode));
  const topColorDarkened = useSharedValue(getTintedBackgroundColor(fallbackColor, isDarkMode));

  const getDarkenedColors = ({ topColor, bottomColor }: { topColor: string; bottomColor: string }) => {
    bottomColorDarkened.value = getTintedBackgroundColor(bottomColor, isDarkMode);
    topColorDarkened.value = getTintedBackgroundColor(topColor, isDarkMode);
  };

  useAnimatedReaction(
    () => ({
      topColor: SwapInputController.topColor.value,
      bottomColor: SwapInputController.bottomColor.value,
    }),
    (current, previous) => {
      if (previous && current !== previous && current !== undefined) {
        runOnJS(getDarkenedColors)(current);
      }
    }
  );

  const backgroundStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.topColor.value,
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
