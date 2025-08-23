import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { Box, globalColors, useColorMode } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { borders } from '@/styles';
import { useTheme } from '@/theme';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import React, { memo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { fadeConfig } from '../constants';
import { AnimatedChainImage } from './AnimatedChainImage';
import { SwapCoinIconTextFallback } from './SwapCoinIconTextFallback';

export const AnimatedSwapCoinIcon = memo(function AnimatedSwapCoinIcon({
  asset,
  size = 32,
  chainSize = size / 2,
  showBadge = true,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  size?: number;
  chainSize?: number;
  showBadge?: boolean;
}) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  const didErrorForUniqueId = useSharedValue<string | undefined>(undefined);

  // Shield animated props from unnecessary updates to avoid flicker
  const coinIconUrl = useDerivedValue(() => asset.value?.icon_url || '');

  const animatedIconSource = useAnimatedProps(() => {
    return {
      source: {
        ...DEFAULT_FASTER_IMAGE_CONFIG,
        borderRadius: IS_ANDROID ? (size / 2) * PIXEL_RATIO : undefined,
        url: coinIconUrl.value,
      },
    };
  });

  const visibility = useDerivedValue(() => {
    const showEmptyState = !asset.value?.uniqueId;
    const showFallback = !showEmptyState && (didErrorForUniqueId.value === asset.value?.uniqueId || !asset.value?.icon_url);
    const showCoinIcon = !showFallback && !showEmptyState;

    return { showCoinIcon, showEmptyState, showFallback };
  });

  const animatedCoinIconWrapperStyles = useAnimatedStyle(() => {
    const assetBackgroundColor = asset.value?.tintedBackgroundColor;
    const backgroundColor = assetBackgroundColor
      ? isDarkMode
        ? getColorValueForThemeWorklet(assetBackgroundColor, isDarkMode)
        : globalColors.white100
      : 'transparent';

    return {
      backgroundColor,
      shadowColor: visibility.value.showCoinIcon ? (isDarkMode ? colors.shadow : asset.value?.shadowColor['light']) : 'transparent',
    };
  });

  const animatedCoinIconStyles = useAnimatedStyle(() => ({
    display: visibility.value.showCoinIcon ? 'flex' : 'none',
    pointerEvents: visibility.value.showCoinIcon ? 'auto' : 'none',
    opacity: withTiming(visibility.value.showCoinIcon ? 1 : 0, fadeConfig),
  }));

  const animatedEmptyStateStyles = useAnimatedStyle(() => ({
    display: visibility.value.showEmptyState ? 'flex' : 'none',
    opacity: withTiming(visibility.value.showEmptyState ? 1 : 0, fadeConfig),
  }));

  const animatedFallbackStyles = useAnimatedStyle(() => ({
    display: visibility.value.showFallback ? 'flex' : 'none',
    pointerEvents: visibility.value.showFallback ? 'auto' : 'none',
    opacity: withTiming(visibility.value.showFallback ? 1 : 0, fadeConfig),
  }));

  return (
    <View style={containerStyle(size)}>
      <Animated.View style={[sx.reactCoinIconContainer, coinIconFallbackStyle(size), sx.withShadow, animatedCoinIconWrapperStyles]}>
        <Animated.View style={animatedCoinIconStyles}>
          {/* ⚠️ TODO: This works but we should figure out how to type this correctly to avoid this error */}
          {/* @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps */}
          <AnimatedFasterImage
            animatedProps={animatedIconSource}
            onError={() => {
              didErrorForUniqueId.value = asset.value?.uniqueId;
            }}
            onSuccess={() => {
              didErrorForUniqueId.value = undefined;
            }}
            style={[
              sx.coinIcon,
              {
                borderRadius: IS_IOS ? size / 2 : undefined,
                height: size,
                width: size,
              },
            ]}
          />
        </Animated.View>

        <Animated.View style={[animatedFallbackStyles, coinIconFallbackStyle(size)]}>
          <SwapCoinIconTextFallback asset={asset} height={size} width={size} style={fallbackIconStyle(size)} />
        </Animated.View>

        <Box
          as={Animated.View}
          background={isDarkMode ? 'fillQuaternary' : 'fillTertiary'}
          style={[animatedEmptyStateStyles, coinIconFallbackStyle(size)]}
        />
      </Animated.View>

      {showBadge && <AnimatedChainImage asset={asset} size={chainSize} />}
    </View>
  );
});

const fallbackIconStyle = (size: number) => ({
  ...borders.buildCircleAsObject(size),
  position: 'absolute' as ViewStyle['position'],
});

const coinIconFallbackStyle = (size: number) => ({
  borderRadius: size / 2,
  height: size,
  width: size,
  overflow: 'visible' as const,
});

const containerStyle = (size: number) => ({
  elevation: 6,
  height: size,
  overflow: 'visible' as const,
});

const sx = StyleSheet.create({
  coinIcon: {
    overflow: 'hidden',
  },
  reactCoinIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  withShadow: {
    elevation: 6,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
