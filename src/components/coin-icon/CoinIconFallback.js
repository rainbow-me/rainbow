import React, { useMemo } from 'react';
import { Image } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import EthIcon from '@/assets/eth-icon.png';
import { AssetTypes } from '@/entities';
import { useBooleanState, useColorForAsset } from '@/hooks';
import { ImageWithCachedMetadata } from '@/components/images';
import styled from '@/styled-thing';
import { borders, fonts, position, shadow } from '@/styles';
import {
  FallbackIcon,
  getUrlForTrustIconFallback,
  isETH,
  magicMemo,
} from '@/utils';

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
    layoutSize,
    theme: { colors },
    shadowColor: color,
    shadowOffset: { height: y, width: x },
    shadowOpacity: opacity,
    shadowRadius: radius,
    showImage,
  }) => ({
    height: layoutSize ?? size,
    width: layoutSize ?? size,
    ...position.coverAsObject,
    ...shadow.buildAsObject(x, y, radius * 2, color, showImage ? opacity : 0),
    backgroundColor: showImage ? colors.surfacePrimary : colors.transparent,
    borderRadius: size / 2,
    overflow: 'visible',
  })
);

// If th size is e.g., 20, we can use 40 that is the default icon size in the (used in discover and wallet list)
const getIconSize = size => {
  if (40 % size === 0) {
    return 40;
  }
  return size;
};

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
        size={getIconSize(size)}
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
        {...(ios && { layoutSize: width })}
        size={ios ? getIconSize(width) : width}
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
