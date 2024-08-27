import { Canvas, Rect, LinearGradient, vec, Paint } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, withTiming } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useColorMode } from '@/design-system';
import { IS_ANDROID, IS_TEST } from '@/env';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { getColorValueForThemeWorklet, getTintedBackgroundColor } from '@/__swaps__/utils/swaps';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { ETH_COLOR, ETH_COLOR_DARK } from '../constants';

const DEFAULT_BACKGROUND_COLOR = getTintedBackgroundColor({ dark: ETH_COLOR_DARK, light: ETH_COLOR });

export const SwapBackground = () => {
  const { isDarkMode } = useColorMode();
  const { internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  const animatedTopColor = useDerivedValue(() => {
    if (IS_TEST) return getColorValueForThemeWorklet(DEFAULT_BACKGROUND_COLOR, isDarkMode, true);
    return withTiming(
      getColorValueForThemeWorklet(internalSelectedInputAsset.value?.tintedBackgroundColor || DEFAULT_BACKGROUND_COLOR, isDarkMode, true),
      TIMING_CONFIGS.slowFadeConfig
    );
  });

  const animatedBottomColor = useDerivedValue(() => {
    if (IS_TEST) return getColorValueForThemeWorklet(DEFAULT_BACKGROUND_COLOR, isDarkMode, true);
    return withTiming(
      getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.tintedBackgroundColor || DEFAULT_BACKGROUND_COLOR, isDarkMode, true),
      TIMING_CONFIGS.slowFadeConfig
    );
  });

  const gradientColors = useDerivedValue(() => {
    return [animatedTopColor.value, animatedBottomColor.value];
  });

  if (IS_TEST) {
    return <View style={[styles.background, { backgroundColor: animatedTopColor.value }]} />;
  }

  return (
    <Canvas style={styles.background}>
      <Rect height={DEVICE_HEIGHT + (IS_ANDROID ? 24 : 0)} width={DEVICE_WIDTH} x={0} y={0}>
        <Paint antiAlias dither>
          <LinearGradient colors={gradientColors} end={vec(DEVICE_WIDTH / 2, DEVICE_HEIGHT)} start={vec(DEVICE_WIDTH / 2, 0)} />
        </Paint>
      </Rect>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  background: {
    borderRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
    flex: 1,
    height: DEVICE_HEIGHT + (IS_ANDROID ? 24 : 0),
    position: 'absolute',
    width: DEVICE_WIDTH,
    zIndex: -10,
  },
});
