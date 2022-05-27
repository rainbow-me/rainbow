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
}: {
  imageUrl: string;
  symbol: string;
  shadowColor: string;
}) {
  const key = `${symbol}-${imageUrl}`;

  const isCached = imagesCache[key];

  // this is a hack
  // we should default to trying to render the image component to fetch the image
  // then we cache the result - is the image available or not
  // and then we default to the result
  const shouldShowImage = typeof isCached === 'undefined' ? true : isCached;
  const [, forceRerender] = useState(0);

  const onLoad = useCallback(() => {
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
  const imageUrl = getUrlForTrustIconFallback(address)!;

  const fallbackIconColor = useColorForAsset({ address });
  const tokenMetadata = getTokenMetadata(address);

  const shadowColor = theme.isDarkMode
    ? theme.colors.shadow
    : tokenMetadata?.shadowColor ?? fallbackIconColor;

  const eth = isETH(address);

  if (ios) {
    return (
      // @ts-ignore
      <CoinIcon address={address} size={40} symbol={symbol} type={assetType} />
    );
  }
  return (
    <View style={cx.container}>
      <FallbackIcon
        color={fallbackIconColor}
        height={40}
        style={fallbackIconStyle}
        symbol={symbol}
        textStyles={fallbackTextStyles}
        width={40}
      />

      {eth ? (
        <Image source={EthIcon} style={cx.coinIconFallback} />
      ) : (
        <CoinIconWithBackground
          imageUrl={imageUrl}
          shadowColor={shadowColor}
          symbol={symbol}
        />
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
    overflow: 'visible',
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
