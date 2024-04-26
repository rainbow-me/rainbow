import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
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

const AnimatedImageWithCachedMetadata = Animated.createAnimatedComponent(ImageWithCachedMetadata);

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

  const key = useDerivedValue(() => `${icon?.value}`);

  const cacheStatus = useSharedValue(imagesCache[key.value]);

  useAnimatedReaction(
    () => key.value,
    (current, previous) => {
      if (current !== previous) {
        cacheStatus.value = imagesCache[current];
      }
    }
  );

  const shouldShowImage = useDerivedValue(() => cacheStatus.value !== ImageState.NOT_FOUND);
  const isLoaded = useDerivedValue(() => cacheStatus.value === ImageState.LOADED);

  const onLoad = useCallback(() => {
    if (isLoaded.value) {
      return;
    }
    imagesCache[key.value] = ImageState.LOADED;
    cacheStatus.value = ImageState.LOADED;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onError = useCallback(
    // @ts-expect-error passed to an untyped JS component
    err => {
      const newError = err?.nativeEvent?.message?.includes('404') ? ImageState.NOT_FOUND : ImageState.ERROR;

      if (cacheStatus.value === newError) {
        return;
      }

      imagesCache[key.value] = newError;
      cacheStatus.value = newError;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    display: shouldDisplay.value ? 'flex' : 'none',
    shadowColor: shadowColor.value,
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    display: true ? 'flex' : 'none',
    backgroundColor: isLoaded.value ? colors.white : undefined,
  }));

  const childrenAnimatedStyle = useAnimatedStyle(() => ({ display: isLoaded.value ? 'flex' : 'none' }));

  const animatedProps = useAnimatedProps(() => {
    console.log('hello');
    console.log(icon?.value);
    return {
      imageUrl: icon?.value,
    };
  });

  return (
    <Animated.View
      style={[sx.coinIconContainer, sx.withShadow, containerAnimatedStyle, { height: size, width: size, borderRadius: size / 2 }]}
    >
      <AnimatedImageWithCachedMetadata
        cache={ImgixImage.cacheControl.immutable}
        animatedProps={animatedProps}
        onError={onError}
        onLoad={onLoad}
        size={size}
        style={[sx.coinIconFallback, imageAnimatedStyle, { height: size, width: size, borderRadius: size / 2 }]}
      />

      <Animated.View style={[sx.fallbackWrapper, childrenAnimatedStyle]}>{children()}</Animated.View>
    </Animated.View>
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
