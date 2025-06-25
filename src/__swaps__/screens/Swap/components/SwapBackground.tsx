import { Canvas, Rect, LinearGradient, vec } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useColorMode } from '@/design-system';
import { IS_ANDROID, IS_TEST } from '@/env';
import { useStableValue } from '@/hooks/useStableValue';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { getColorValueForThemeWorklet, getTintedBackgroundColor } from '@/__swaps__/utils/swaps';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { ETH_COLOR, ETH_COLOR_DARK } from '../constants';

const DEFAULT_BACKGROUND_COLOR = getTintedBackgroundColor({ dark: ETH_COLOR_DARK, light: ETH_COLOR });

export const SwapBackground = () => {
  const { isDarkMode } = useColorMode();
  const { internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  const initialColors = useStableValue(() => {
    const { inputAsset, outputAsset } = useSwapsStore.getState();
    return {
      bottom: getColorValueForThemeWorklet(outputAsset?.tintedBackgroundColor || DEFAULT_BACKGROUND_COLOR, isDarkMode),
      top: getColorValueForThemeWorklet(inputAsset?.tintedBackgroundColor || DEFAULT_BACKGROUND_COLOR, isDarkMode),
    };
  });

  const animatedTopColor = useDerivedValue(() => {
    if (!_WORKLET || IS_TEST) return initialColors.top;
    return withTiming(
      getColorValueForThemeWorklet(internalSelectedInputAsset.value?.tintedBackgroundColor || DEFAULT_BACKGROUND_COLOR, isDarkMode),
      TIMING_CONFIGS.slowFadeConfig
    );
  });

  const animatedBottomColor = useDerivedValue(() => {
    if (!_WORKLET || IS_TEST) return initialColors.bottom;
    return withTiming(
      getColorValueForThemeWorklet(internalSelectedOutputAsset.value?.tintedBackgroundColor || DEFAULT_BACKGROUND_COLOR, isDarkMode),
      TIMING_CONFIGS.slowFadeConfig
    );
  });

  const gradientColors = useDerivedValue(() => {
    return _WORKLET ? [animatedTopColor.value, animatedBottomColor.value] : [initialColors.top, initialColors.bottom];
  });

  if (IS_TEST) {
    return <View style={[styles.background, { backgroundColor: initialColors.top }]} />;
  }

  return (
    <Canvas style={[styles.background, { backgroundColor: initialColors.top }]}>
      <Rect antiAlias dither height={DEVICE_HEIGHT + (IS_ANDROID ? 24 : 0)} width={DEVICE_WIDTH} x={0} y={0}>
        <LinearGradient colors={gradientColors} end={vec(DEVICE_WIDTH / 2, DEVICE_HEIGHT)} start={vec(DEVICE_WIDTH / 2, 0)} />
      </Rect>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  background: {
    borderRadius: IS_ANDROID ? 20 : 0,
    flex: 1,
    height: DEVICE_HEIGHT + (IS_ANDROID ? 24 : 0),
    position: 'absolute',
    width: DEVICE_WIDTH,
    zIndex: -10,
  },
});
