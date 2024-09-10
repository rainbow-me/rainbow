/* eslint-disable no-nested-ternary */
import React, { memo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { borders } from '@/styles';
import { useTheme } from '@/theme';
import Animated, { useAnimatedProps, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { AnimatedChainImage } from './AnimatedChainImage';
import { fadeConfig } from '../constants';
import { SwapCoinIconTextFallback } from './SwapCoinIconTextFallback';
import { Box } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import { useSwapContext } from '../providers/swap-provider';

const fallbackIconStyle = {
  ...borders.buildCircleAsObject(32),
  position: 'absolute' as ViewStyle['position'],
};

const largeFallbackIconStyle = {
  ...borders.buildCircleAsObject(36),
  position: 'absolute' as ViewStyle['position'],
};

const smallFallbackIconStyle = {
  ...borders.buildCircleAsObject(16),
  position: 'absolute' as ViewStyle['position'],
};

export const AnimatedSwapCoinIcon = memo(function FeedCoinIcon({
  assetType,
  large = true,
  small,
  showBadge = true,
}: {
  assetType: 'input' | 'output';
  large?: boolean;
  small?: boolean;
  showBadge?: boolean;
}) {
  const { isDarkMode, colors } = useTheme();
  const { internalSelectedInputAsset, internalSelectedOutputAsset } = useSwapContext();

  const asset = assetType === 'input' ? internalSelectedInputAsset : internalSelectedOutputAsset;
  const size = small ? 16 : large ? 36 : 32;

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

  const animatedCoinIconWrapperStyles = useAnimatedStyle(() => ({
    shadowColor: visibility.value.showCoinIcon ? (isDarkMode ? colors.shadow : asset.value?.shadowColor['light']) : 'transparent',
  }));

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
    <View style={small ? sx.containerSmall : large ? sx.containerLarge : sx.container}>
      <Animated.View
        style={[
          sx.reactCoinIconContainer,
          small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback,
          sx.withShadow,
          animatedCoinIconWrapperStyles,
        ]}
      >
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

        <Animated.View
          style={[animatedFallbackStyles, small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback]}
        >
          <SwapCoinIconTextFallback
            asset={asset}
            height={size}
            width={size}
            style={small ? smallFallbackIconStyle : large ? largeFallbackIconStyle : fallbackIconStyle}
          />
        </Animated.View>

        <Box
          as={Animated.View}
          background={isDarkMode ? 'fillQuaternary' : 'fillTertiary'}
          style={[
            animatedEmptyStateStyles,
            small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback,
            {
              borderRadius: size / 2,
              height: size,
              width: size,
            },
          ]}
        />
      </Animated.View>

      {showBadge && <AnimatedChainImage assetType={assetType} size={16} />}
    </View>
  );
});

const sx = StyleSheet.create({
  coinIcon: {
    overflow: 'hidden',
  },
  coinIconFallback: {
    borderRadius: 16,
    height: 32,
    overflow: 'visible',
    width: 32,
  },
  coinIconFallbackLarge: {
    borderRadius: 18,
    height: 36,
    overflow: 'visible',
    width: 36,
  },
  coinIconFallbackSmall: {
    borderRadius: 8,
    height: 16,
    overflow: 'visible',
    width: 16,
  },
  container: {
    elevation: 6,
    height: 32,
    overflow: 'visible',
  },
  containerLarge: {
    elevation: 6,
    height: 36,
    overflow: 'visible',
  },
  containerSmall: {
    elevation: 6,
    height: 16,
    overflow: 'visible',
  },
  emptyState: {
    pointerEvents: 'none',
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
