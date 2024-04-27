import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ImageWithCachedMetadata, ImgixImage } from '@/components/images';
import { ThemeContextProps } from '@/theme';
import Animated, {
  DerivedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { FasterImageView } from '@candlefinance/faster-image';

const AnimatedImageWithCachedMetadata = Animated.createAnimatedComponent(ImageWithCachedMetadata);
const AnimatedFasterImage = Animated.createAnimatedComponent(FasterImageView);

const ImageState = {
  ERROR: 'ERROR',
  LOADED: 'LOADED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

const imagesCache: { [imageUrl: string]: keyof typeof ImageState } = {};

export const AnimatedFastFallbackCoinIconImage = React.memo(function FastFallbackCoinIconImage({
  size = 40,
  icon,
  shadowColor,
  theme,
  shouldDisplay,
  children,
}: {
  size?: number;
  icon?: DerivedValue<string | undefined>;
  theme: ThemeContextProps;
  shadowColor: DerivedValue<string | undefined>;
  shouldDisplay: DerivedValue<boolean>;
  children: () => React.ReactNode;
}) {
  const { colors } = theme;

  const key = `${icon?.value}`;

  const [cacheStatus, setCacheStatus] = useState(imagesCache[key]);

  const shouldShowImage = cacheStatus !== ImageState.NOT_FOUND;
  const isLoaded = cacheStatus === ImageState.LOADED;

  const opts = useDerivedValue(() => ({ url: icon?.value ?? '' }));

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
    <View style={[sx.coinIconContainer, sx.withShadow, { height: size, width: size, borderRadius: size / 2 }]}>
      {shouldShowImage && (
        <AnimatedFasterImage
          // cache={ImgixImage.cacheControl.immutable}
          source={opts}
          onError={onError}
          onSuccess={onLoad}
          // size={size}
          style={[
            sx.coinIconFallback,
            isLoaded && { backgroundColor: colors.white },
            { height: size, width: size, borderRadius: size / 2 },
          ]}
        />
      )}

      {!isLoaded && <View style={sx.fallbackWrapper}>{children()}</View>}
    </View>
  );
});

const sx = StyleSheet.create({
  coinIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  coinIconFallback: {
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
