import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import CoinIcon from '../../../coin-icon/CoinIcon';
import { FastChainBadge } from './FastCoinBadge';
import EthIcon from '@rainbow-me/assets/eth-icon.png';
import { AssetType } from '@rainbow-me/entities';
import { useColorForAsset } from '@rainbow-me/hooks';
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

const imagesCache: { [imageUrl: string]: boolean } = {};

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

  const isCached = imagesCache[key];

  // this is a hack
  // we should default to trying to render the image component to fetch the image
  // then we cache the result - is the image available or not
  // and then we default to the result
  // the point here is to have imagesCache static outside the component.
  // Unfortunately, there is no easy way to check if some image is in Fast Image's cache.
  // So we store it here so when we recycle the view
  // it immediately can decide whether to render the image or not.
  // Fast Image doesn't have easy way to render "default" component.
  // Many images are transparent so we have to render background for it.
  const shouldShowImage = isCached ?? true;
  const [, forceRerender] = useState(0);

  const onLoad = useCallback(() => {
    // because of some race conditions or whatever sometimes it just doesn't work
    // when we use `imagesCached` boolean as a state
    imagesCache[key] = true;
    forceRerender(prev => prev + 1);
  }, [key, forceRerender]);
  const onError = useCallback(() => {
    imagesCache[key] = false;

    forceRerender(prev => prev + 1);
  }, [key, forceRerender]);

  return (
    <View
      style={[cx.coinIconContainer, { shadowColor }, isCached && cx.withShadow]}
    >
      {shouldShowImage && (
        <ImageWithCachedMetadata
          cache={ImgixImage.cacheControl.immutable}
          imageUrl={imageUrl}
          onError={onError}
          onLoad={onLoad}
          size={32}
          style={[cx.coinIconFallback, isCached && cx.withBackground]}
        />
      )}

      {!isCached && <View style={cx.fallbackWrapper}>{children()}</View>}
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
