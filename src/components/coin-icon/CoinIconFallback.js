import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColorForAsset, useForceUpdate } from '@/hooks';
import { ImageWithCachedMetadata, ImgixImage } from '@/components/images';
import { FallbackIcon, getUrlForTrustIconFallback } from '@/utils';
import { borders, fonts } from '@/styles';

const ImageState = {
  ERROR: 'ERROR',
  LOADED: 'LOADED',
  NOT_FOUND: 'NOT_FOUND',
};

const imagesCache = {};

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const fallbackIconStyle = size => {
  return {
    ...borders.buildCircleAsObject(size),
    position: 'absolute',
  };
};

export const CoinIconFallback = fallbackProps => {
  const {
    address,
    assetType,
    height,
    symbol,
    shadowColor,
    theme,
    size,
    width,
  } = fallbackProps;

  const { colors } = theme;
  const imageUrl = getUrlForTrustIconFallback(address, assetType);

  const key = `${symbol}-${imageUrl}`;

  const shouldShowImage = imagesCache[key] !== ImageState.NOT_FOUND;
  const isLoaded = imagesCache[key] === ImageState.LOADED;

  const fallbackIconColor = useColorForAsset({
    address,
    assetType,
  });

  // we store data inside the object outside the component
  // so we can share it between component instances
  // but we still want the component to pick up new changes
  const forceUpdate = useForceUpdate();

  const onLoad = useCallback(() => {
    if (imagesCache[key] === ImageState.LOADED) {
      return;
    }

    imagesCache[key] = ImageState.LOADED;
    forceUpdate();
  }, [key, forceUpdate]);
  const onError = useCallback(
    // @ts-expect-error passed to an untyped JS component
    err => {
      const newError = err?.nativeEvent?.message?.includes('404')
        ? ImageState.NOT_FOUND
        : ImageState.ERROR;
      if (imagesCache[key] === newError) {
        return;
      } else {
        imagesCache[key] = newError;
      }

      forceUpdate();
    },
    [key, forceUpdate]
  );

  return (
    <View style={[sx.coinIconContainer, sx.withShadow, { shadowColor }]}>
      {shouldShowImage && (
        <ImageWithCachedMetadata
          cache={ImgixImage.cacheControl.immutable}
          imageUrl={imageUrl}
          onError={onError}
          onLoad={onLoad}
          size={size}
          style={[
            sx.coinIconFallback,
            isLoaded && { backgroundColor: colors.white },
            { height, width, borderRadius: height / 2 },
          ]}
          {...fallbackProps}
        />
      )}

      {!isLoaded && (
        <FallbackIcon
          color={fallbackIconColor}
          height={size}
          style={fallbackIconStyle(size)}
          symbol={symbol}
          textStyles={fallbackTextStyles}
          width={size}
        />
      )}
    </View>
  );
};

const sx = StyleSheet.create({
  coinIconContainer: {
    alignItems: 'center',

    justifyContent: 'center',
    overflow: 'visible',
  },
  coinIconFallback: {
    overflow: 'hidden',
  },
  container: {
    elevation: 6,

    overflow: 'visible',
    paddingTop: 9,
  },
  contract: {},
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
