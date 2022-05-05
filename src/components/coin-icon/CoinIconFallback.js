import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '../../context/ThemeContext';
import EthIcon from '@rainbow-me/assets/eth-icon.png';
import { useBooleanState, useColorForAsset } from '@rainbow-me/hooks';
import { ImageWithCachedMetadata, ImgixImage } from '@rainbow-me/images';
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

const FallbackImage = React.memo(props => {
  const {
    size,
    shadowColor: color,
    shadowOffset: { height: y, width: x },
    shadowOpacity: opacity,
    shadowRadius: radius,
    showImage,
    as: ImageComponent = ImageWithCachedMetadata,
  } = props;

  const style = useMemo(
    () => ({
      height: size,
      width: size,
      ...position.coverAsObject,
      ...shadow.buildAsObject(x, y, radius * 2, color, showImage ? opacity : 0),
      backgroundColor: 'transparent',
      borderRadius: size / 2,
      overflow: 'visible',
    }),
    [size, showImage, x, y, radius, color, opacity]
  );

  return (
    <ImageComponent
      {...props}
      cache={ImgixImage.cacheControl.immutable}
      size={32}
      style={style}
    />
  );
});

FallbackImage.displayName = 'FallbackImage';

const WrappedFallbackImage = React.memo(
  ({ color, elevation = 6, shadowOpacity, showImage, size, eth, ...props }) => {
    const { colors } = useTheme();

    const containerStyles = {
      ...position.coverAsObject,
      ...borders.buildCircleAsObject(size),
      alignItems: 'center',
      elevation: showImage ? elevation : 0,
      flexWrap: 'wrap',
      justifyContent: 'center',
      overflow: 'hidden',
    };

    return (
      <View {...props} style={containerStyles}>
        <FallbackImage
          as={eth ? FastImage : ImageWithCachedMetadata}
          source={eth ? EthIcon : props.imageUrl}
          {...props}
          overlayColor={color || colors.dark}
          shadowOpacity={shadowOpacity}
          showImage={showImage}
          size={size}
        />
      </View>
    );
  }
);

WrappedFallbackImage.displayName = 'WrappedFallbackImage';

const FallbackImageElement = android ? WrappedFallbackImage : FallbackImage;

const CoinIconFallback = fallbackProps => {
  const { address = '', height, symbol, width } = fallbackProps;

  const [showImage, showFallbackImage, hideFallbackImage] = useBooleanState(
    true
  );

  const fallbackIconColor = useColorForAsset({ address });
  const imageUrl = useMemo(() => getUrlForTrustIconFallback(address), [
    address,
  ]);

  const eth = isETH(address);

  return (
    <View style={[styles.container, { height, width }]}>
      <FallbackIcon
        {...fallbackProps}
        color={fallbackIconColor}
        showImage={showImage}
        symbol={symbol || ''}
        textStyles={fallbackTextStyles}
      />

      <FallbackImageElement
        {...fallbackProps}
        color={fallbackIconColor}
        eth={eth}
        imageUrl={imageUrl}
        onError={hideFallbackImage}
        showImage={showImage}
        size={width}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default magicMemo(CoinIconFallback, ['address', 'style', 'symbol']);
