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
  theme,
  color,
  symbol,
}: {
  imageUrl: string;
  theme: any;
  color: string;
  symbol: string;
}) {
  const { colors } = theme;

  const key = `${symbol}-${imageUrl}`;

  const isCached = imagesCache[key];

  // this is hack
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
    <View style={cx.coinIconContainer}>
      {shouldShowImage && (
        <ImageWithCachedMetadata
          cache={ImgixImage.cacheControl.immutable}
          imageUrl={imageUrl}
          onError={onError}
          onLoad={onLoad}
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
          color={fallbackIconColor}
          imageUrl={imageUrl}
          symbol={symbol}
          theme={theme}
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
});
