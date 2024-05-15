/* eslint-disable no-nested-ternary */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { borders } from '@/styles';
import { useTheme } from '@/theme';
import Animated, { SharedValue, useAnimatedProps, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { AnimatedFasterImage } from '@/components/AnimatedComponents/AnimatedFasterImage';
import { AnimatedChainImage } from './AnimatedChainImage';
import { fadeConfig } from '../constants';
import { SwapCoinIconTextFallback } from './SwapCoinIconTextFallback';

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

export const SwapCoinIcon = React.memo(function FeedCoinIcon({
  asset,
  large,
  small,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  large?: boolean;
  small?: boolean;
}) {
  const { isDarkMode, colors } = useTheme();

  const animatedIconSource = useAnimatedProps(() => {
    console.log({ iconUrl: asset.value?.icon_url });
    return {
      source: {
        ...DEFAULT_FASTER_IMAGE_CONFIG,
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
    return {
      display: asset.value?.icon_url ? 'flex' : 'none',
      pointerEvents: asset.value?.icon_url ? 'auto' : 'none',
      opacity: withTiming(asset.value?.icon_url ? 1 : 0, fadeConfig),
    };
  });

  const animatedFallbackStyles = useAnimatedStyle(() => {
    return {
      display: asset.value?.icon_url ? 'none' : 'flex',
      pointerEvents: asset.value?.icon_url ? 'none' : 'auto',
      opacity: withTiming(asset.value?.icon_url ? 0 : 1, fadeConfig),
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
          {/* @ts-expect-error missing props "source" */}
          <AnimatedFasterImage
            animatedProps={animatedIconSource}
            style={[
              sx.coinIcon,
              {
                height: small ? 16 : large ? 36 : 32,
                width: small ? 16 : large ? 36 : 32,
                borderRadius: (small ? 16 : large ? 36 : 32) / 2,
              },
            ]}
          />
        </Animated.View>

        <Animated.View style={[animatedFallbackStyles, sx.coinIconFallback]}>
          <SwapCoinIconTextFallback
            asset={asset}
            height={small ? 16 : large ? 36 : 32}
            width={small ? 16 : large ? 36 : 32}
            style={small ? smallFallbackIconStyle : large ? largeFallbackIconStyle : fallbackIconStyle}
          />
        </Animated.View>
      </Animated.View>

      <AnimatedChainImage asset={asset} size={16} />
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
