import React, { useCallback } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import CoinIcon from '../../../coin-icon/CoinIcon';
import { FastChainBadge } from './FastCoinBadge';
import EthIcon from '@rainbow-me/assets/eth-icon.png';
import { AssetType } from '@rainbow-me/entities';
import { useColorForAsset, useForceUpdate } from '@rainbow-me/hooks';
import { ImageWithCachedMetadata, ImgixImage } from '@rainbow-me/images';
import { borders, fonts } from '@rainbow-me/styles';
import {
  FallbackIcon,
  getTokenMetadata,
  getUrlForTrustIconFallback,
  isETH,
} from '@rainbow-me/utils';

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const fallbackIconStyle = {
  ...borders.buildCircleAsObject(40),
  position: 'absolute',
};

const ImageState = {
  ERROR: 'ERROR',
  LOADED: 'LOADED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

const imagesCache: { [imageUrl: string]: keyof typeof ImageState } = {};

const CoinIconWithBackground = React.memo(function CoinIconWithBackground({
  imageUrl,
  symbol,
  shadowColor,
  children,
}: {
  imageUrl: string;
  symbol: string;
  shadowColor: string;
  children: () => React.ReactNode;
}) {
  const key = `${symbol}-${imageUrl}`;

  const shouldShowImage = imagesCache[key] !== ImageState.NOT_FOUND;
  const isLoaded = imagesCache[key] === ImageState.LOADED;

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
    err => {
      const newError = err.nativeEvent.message?.includes('404')
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
    <View
      style={[cx.coinIconContainer, { shadowColor }, isLoaded && cx.withShadow]}
    >
      {shouldShowImage && (
        <ImageWithCachedMetadata
          cache={ImgixImage.cacheControl.immutable}
          imageUrl={imageUrl}
          onError={onError}
          onLoad={onLoad}
          size={32}
          style={[cx.coinIconFallback, isLoaded && cx.withBackground]}
        />
      )}

      {!isLoaded && <View style={cx.fallbackWrapper}>{children()}</View>}
    </View>
  );
});

export default React.memo(function FastCoinIcon({
  address,
  symbol,
  assetType,
  theme,
}: {
  address: string;
  symbol: string;
  assetType?: AssetType;
  theme: any;
}) {
  const imageUrl = getUrlForTrustIconFallback(
    address,
    assetType ?? AssetType.token
  )!;

  const fallbackIconColor = useColorForAsset({
    address,
    type: assetType,
  });

  const tokenMetadata = getTokenMetadata(address);

  const shadowColor = theme.isDarkMode
    ? theme.colors.shadow
    : tokenMetadata?.shadowColor ?? fallbackIconColor;

  const eth = isETH(address);

  if (ios) {
    return (
      <View style={cx.container}>
        {/* @ts-ignore */}
        <CoinIcon
          address={address}
          size={40}
          symbol={symbol}
          type={assetType}
        />
      </View>
    );
  }
  return (
    <View style={cx.container}>
      {eth ? (
        <Image source={EthIcon} style={cx.coinIconFallback} />
      ) : (
        <CoinIconWithBackground
          imageUrl={imageUrl}
          shadowColor={shadowColor}
          symbol={symbol}
        >
          {() => (
            <FallbackIcon
              color={fallbackIconColor}
              height={40}
              style={fallbackIconStyle}
              symbol={symbol}
              textStyles={fallbackTextStyles}
              width={40}
            />
          )}
        </CoinIconWithBackground>
      )}

      {assetType && <FastChainBadge assetType={assetType} theme={theme} />}
    </View>
  );
});

const cx = StyleSheet.create({
  coinIconContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
    // overflow: 'visible',
    width: 40,
  },
  coinIconFallback: {
    borderRadius: 20,
    height: 40,
    overflow: 'visible',
    width: 40,
  },
  container: {
    elevation: 6,
    height: 60,
    overflow: 'visible',
    paddingTop: 9.5,
  },
  fallbackWrapper: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  withBackground: {
    backgroundColor: 'white',
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
