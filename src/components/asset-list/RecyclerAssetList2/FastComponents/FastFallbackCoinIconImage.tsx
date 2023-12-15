import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Network } from '@/networks/types';
import { ImageWithCachedMetadata, ImgixImage } from '@/components/images';
import { ThemeContextProps } from '@/theme';
import { getUrlForTrustIconFallback } from '@/utils';

const ImageState = {
  ERROR: 'ERROR',
  LOADED: 'LOADED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

const imagesCache: { [imageUrl: string]: keyof typeof ImageState } = {};

export const FastFallbackCoinIconImage = React.memo(
  function FastFallbackCoinIconImage({
    address,
    network,
    symbol,
    shadowColor,
    theme,
    children,
  }: {
    theme: ThemeContextProps;
    address: string;
    network: Network;
    symbol: string;
    shadowColor: string;
    children: () => React.ReactNode;
  }) {
    const { colors } = theme;
    const imageUrl = getUrlForTrustIconFallback(address, network)!;

    const key = `${symbol}-${imageUrl}`;

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
        const newError = err?.nativeEvent?.message?.includes('404')
          ? ImageState.NOT_FOUND
          : ImageState.ERROR;

        if (cacheStatus === newError) {
          return;
        }

        imagesCache[key] = newError;
        setCacheStatus(newError);
      },
      [cacheStatus, key]
    );

    return (
      <View style={[sx.coinIconContainer, sx.withShadow, { shadowColor }]}>
        {shouldShowImage && (
          <ImageWithCachedMetadata
            cache={ImgixImage.cacheControl.immutable}
            imageUrl={imageUrl}
            onError={onError}
            onLoad={onLoad}
            size={40}
            style={[
              sx.coinIconFallback,
              isLoaded && { backgroundColor: colors.white },
            ]}
          />
        )}

        {!isLoaded && <View style={sx.fallbackWrapper}>{children()}</View>}
      </View>
    );
  }
);

const sx = StyleSheet.create({
  coinIconContainer: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    overflow: 'visible',
    width: 40,
  },
  coinIconFallback: {
    borderRadius: 20,
    height: 40,
    overflow: 'hidden',
    width: 40,
  },
  container: {
    elevation: 6,
    height: 59,
    overflow: 'visible',
    paddingTop: 9,
  },
  contract: {
    height: 40,
    width: 40,
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
