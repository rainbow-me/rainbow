import React, { useMemo } from 'react';
import { Image } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import EthIcon from '@rainbow-me/assets/eth-icon.png';
import { AssetTypes } from '@rainbow-me/entities';
import { useBooleanState, useColorForAsset } from '@rainbow-me/hooks';
import { ImageWithCachedMetadata } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { borders, fonts, position, shadow } from '@rainbow-me/styles';
import {
  FallbackIcon,
  getUrlForTrustIconFallback,
  isETH,
  magicMemo,
} from '@rainbow-me/utils';

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const FallbackImage = styled(ImageWithCachedMetadata)(
  ({
    size,
    theme: { colors },
    shadowColor: color,
    shadowOffset: { height: y, width: x },
    shadowOpacity: opacity,
    shadowRadius: radius,
    showImage,
  }) => ({
    height: size,
    width: size,
    ...position.coverAsObject,
    ...shadow.buildAsObject(x, y, radius * 2, color, showImage ? opacity : 0),
    backgroundColor: showImage ? colors.white : colors.transparent,
    borderRadius: size / 2,
    overflow: 'visible',
  })
);

function WrappedFallbackImage({
  color,
  elevation = 6,
  shadowOpacity,
  showImage,
  size,
  eth,
  type,
  ...props
}) {
  const { colors } = useTheme();
  return (
    <Centered
      {...props}
      {...position.coverAsObject}
      {...borders.buildCircleAsObject(size)}
      backgroundColor={colors.alpha(color || colors.dark, shadowOpacity || 0.3)}
      elevation={showImage ? elevation : 0}
      style={{ overflow: 'hidden' }}
    >
      <FallbackImage
        as={eth ? Image : undefined}
        source={EthIcon}
        {...props}
        overlayColor={color || colors.dark}
        shadowOpacity={shadowOpacity}
        showImage={showImage}
        size={size}
        type={type}
      />
    </Centered>
  );
}

const FallbackImageElement = android ? WrappedFallbackImage : FallbackImage;

const CoinIconFallback = fallbackProps => {
  const {
    address = '',
    mainnet_address,
    height,
    symbol,
    width,
    type,
  } = fallbackProps;

  const [showImage, showFallbackImage, hideFallbackImage] = useBooleanState(
    false
  );

  const fallbackIconColor = useColorForAsset({
    address: mainnet_address || address,
    type: mainnet_address ? AssetTypes.token : type,
  });
  const imageUrl = useMemo(
    () =>
      getUrlForTrustIconFallback(
        mainnet_address || address,
        mainnet_address ? AssetTypes.token : type
      ),
    [address, mainnet_address, type]
  );

  const eth = isETH(address);

  return (
    <Centered height={height} width={width}>
      {!showImage && (
        <FallbackIcon
          {...fallbackProps}
          color={fallbackIconColor}
          showImage={showImage}
          symbol={symbol || ''}
          textStyles={fallbackTextStyles}
        />
      )}
      <FallbackImageElement
        {...fallbackProps}
        color={fallbackIconColor}
        eth={eth}
        imageUrl={imageUrl}
        onError={hideFallbackImage}
        onLoad={showFallbackImage}
        showImage={showImage}
        size={width}
      />
    </Centered>
  );
};

export default magicMemo(CoinIconFallback, [
  'address',
  'type',
  'style',
  'symbol',
]);
