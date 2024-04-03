import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Network } from '@/networks/types';
import { ThemeContextProps } from '@/theme';
import Animated, { DerivedValue } from 'react-native-reanimated';
import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';

const ImageState = {
  ERROR: 'ERROR',
  LOADED: 'LOADED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

const imagesCache: { [imageUrl: string]: keyof typeof ImageState } = {};

const AnimatedFasterImage = Animated.createAnimatedComponent(FasterImageView);

export const AnimatedCoinIconImage = function FastFallbackCoinIconImage({
  size = 40,
  shadowColor,
  theme,
  source,
  children,
}: {
  source: DerivedValue<ImageOptions>;
  size?: number;
  theme: ThemeContextProps;
  symbol: string;
  shadowColor: string;
  children: () => React.ReactNode;
}) {
  const { colors } = theme;

  const key = `${source.value.url}`;

  const [cacheStatus, setCacheStatus] = useState(imagesCache[key]);

  const shouldShowImage = cacheStatus !== ImageState.NOT_FOUND;
  const isLoaded = cacheStatus === ImageState.LOADED;

  const onLoad = useCallback(() => {
    if (isLoaded) {
      return;
    }
    imagesCache[key] = ImageState.LOADED;
    setCacheStatus(ImageState.LOADED);
  }, [key, isLoaded]);

  const onError = useCallback(
    // @ts-expect-error passed to an untyped JS component
    err => {
      const newError = err?.nativeEvent?.message?.includes('404') ? ImageState.NOT_FOUND : ImageState.ERROR;

      if (cacheStatus === newError) {
        return;
      }

      imagesCache[key] = newError;
      setCacheStatus(newError);
    },
    [cacheStatus, key]
  );

  return (
    <Animated.View style={[sx.coinIconContainer, sx.withShadow, { shadowColor, height: size, width: size }]}>
      {shouldShowImage && (
        <AnimatedFasterImage
          source={source}
          onError={onError}
          onSuccess={onLoad}
          style={[sx.coinIconFallback, isLoaded && { backgroundColor: colors.white }, { height: size, width: size }]}
        />
      )}

      {!isLoaded && <Animated.View style={sx.fallbackWrapper}>{children()}</Animated.View>}
    </Animated.View>
  );
};

const sx = StyleSheet.create({
  coinIconContainer: {
    alignItems: 'center',
    borderRadius: 20,
    justifyContent: 'center',
    overflow: 'visible',
  },
  coinIconFallback: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  fallbackWrapper: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  reactCoinIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactCoinIconImage: {
    height: '100%',
    width: '100%',
  },
  withShadow: {
    elevation: 6,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
