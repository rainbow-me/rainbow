import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { AnimatedText, useColorMode } from '@/design-system';
import { fonts } from '@/styles';
import React from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

const sx = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultTextStyles: {
    fontFamily: fonts.family.SFProRounded,
    fontWeight: fonts.weight.heavy as TextStyle['fontWeight'],
    letterSpacing: fonts.letterSpacing.roundedTight,
    textAlign: 'center' as TextStyle['textAlign'],
  },
});

function buildFallbackFontSize(symbol: string, width: number) {
  'worklet';

  if (!symbol) return 0;
  else if (width < 30 || symbol.length > 4) return 8;
  else if (symbol.length === 4) return 10;
  else if (symbol.length === 1 || symbol.length === 2) return 13;
  return 11;
}

function formatSymbol(symbol: string | undefined, width: number) {
  'worklet';

  if (!symbol) return '';

  return symbol.replace(/[^a-zA-Z0-9]/g, '').substring(0, width < 30 ? 1 : 5);
}

type SwapCoinIconTextFallbackProps = {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  height: number;
  width: number;
  style?: ViewStyle;
  symbol?: string;
};

export const SwapCoinIconTextFallback = ({ asset, height, width, style }: SwapCoinIconTextFallbackProps) => {
  const { isDarkMode } = useColorMode();

  const backgroundColor = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(asset.value?.color, isDarkMode, true),
    };
  });

  const formattedSymbol = useDerivedValue(() => {
    return formatSymbol(asset.value?.symbol, width);
  });

  const animatedFontSize = useAnimatedStyle(() => {
    return {
      fontSize: buildFallbackFontSize(formattedSymbol.value, width),
      color: getColorValueForThemeWorklet(asset.value?.textColor, isDarkMode, true),
    };
  });

  return (
    <Animated.View
      style={[
        sx.container,
        {
          height,
          width,
        },
        style,
        backgroundColor,
      ]}
    >
      <AnimatedText size="11pt" style={[sx.defaultTextStyles, animatedFontSize]}>
        {formattedSymbol}
      </AnimatedText>
    </Animated.View>
  );
};
