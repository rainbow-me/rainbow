import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
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

export default React.memo(function FastCoinIcon({
  address,
  symbol,
  assetType,
  theme,
}: {
  address: string;
  symbol: string;
  assetType: keyof typeof AssetType;
  theme: any;
}) {
  const imageUrl = getUrlForTrustIconFallback(address);

  const fallbackIconColor = useColorForAsset({ address });

  const eth = isETH(address);

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
        <ImageWithCachedMetadata
          cache={ImgixImage.cacheControl.immutable}
          imageUrl={imageUrl}
          style={cx.coinIconFallback}
        />
      )}
      <FastChainBadge assetType={assetType} theme={theme} />
    </View>
  );
});

const cx = StyleSheet.create({
  coinIconFallback: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  container: {
    overflow: 'visible',
  },
});
