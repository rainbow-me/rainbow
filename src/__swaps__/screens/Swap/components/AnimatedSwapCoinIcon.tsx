/* eslint-disable no-nested-ternary */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { borders } from '@/styles';
import { useTheme } from '@/theme';
import Animated, { SharedValue, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { AnimatedChainImage } from './AnimatedChainImage';
import { fadeConfig } from '../constants';
import { SwapCoinIconTextFallback } from './SwapCoinIconTextFallback';
import { Box } from '@/design-system';
import { IS_ANDROID } from '@/env';

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

export const AnimatedSwapCoinIcon = React.memo(function FeedCoinIcon({
  asset,
  large = true,
  small,
  showBadge = true,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  large?: boolean;
  small?: boolean;
  showBadge?: boolean;
}) {
  const { isDarkMode, colors } = useTheme();

  const didErrorForUniqueId = useSharedValue<string | undefined>(undefined);

  const size = small ? 16 : large ? 36 : 32;

  const animatedIconSource = useAnimatedProps(() => {
    return {
      source: {
        ...DEFAULT_FASTER_IMAGE_CONFIG,
        borderRadius: IS_ANDROID ? size / 2 : undefined,
        transitionDuration: 0,
        url: asset.value?.icon_url ?? '',
      },
    };
  });

  const animatedCoinIconWrapperStyles = useAnimatedStyle(() => {
    return {
      shadowColor: isDarkMode ? colors.shadow : asset.value?.shadowColor['light'],
    };
  });

  const animatedCoinIconStyles = useAnimatedStyle(() => {
    const showEmptyState = !asset.value?.uniqueId;
    const showFallback = didErrorForUniqueId.value === asset.value?.uniqueId;
    const shouldDisplay = !showFallback && !showEmptyState;

    return {
      display: shouldDisplay ? 'flex' : 'none',
      pointerEvents: shouldDisplay ? 'auto' : 'none',
      opacity: withTiming(shouldDisplay ? 1 : 0, fadeConfig),
    };
  });

  const animatedEmptyStateStyles = useAnimatedStyle(() => {
    const showEmptyState = !asset.value?.uniqueId;

    return {
      display: showEmptyState ? 'flex' : 'none',
      opacity: withTiming(showEmptyState ? 1 : 0, fadeConfig),
    };
  });

  const animatedFallbackStyles = useAnimatedStyle(() => {
    const showEmptyState = !asset.value?.uniqueId;
    const showFallback = !showEmptyState && didErrorForUniqueId.value === asset.value?.uniqueId;

    return {
      display: showFallback ? 'flex' : 'none',
      pointerEvents: showFallback ? 'auto' : 'none',
      opacity: withTiming(showFallback ? 1 : 0, fadeConfig),
    };
  });

  return (
    <View style={small ? sx.containerSmall : large ? sx.containerLarge : sx.container}>
      <Animated.View
        style={[
          sx.reactCoinIconContainer,
          animatedCoinIconWrapperStyles,
          small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback,
          sx.withShadow,
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
                borderRadius: size / 2,
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
          background="fillQuaternary"
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

      {showBadge && <AnimatedChainImage asset={asset} size={16} />}
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
