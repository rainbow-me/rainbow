import React, { useMemo } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { Centered } from '../layout';
import { useBooleanState, useColorForAsset } from '@rainbow-me/hooks';
import { ImageWithCachedMetadata } from '@rainbow-me/images';
import { borders, fonts, position, shadow } from '@rainbow-me/styles';
import { getUrlForTrustIconFallback, magicMemo } from '@rainbow-me/utils';

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const FallbackImage = styled(ImageWithCachedMetadata)`
  ${position.cover};
  ${({
    shadowColor: color,
    shadowOffset: { height: y, width: x },
    shadowOpacity: opacity,
    shadowRadius: radius,
    showImage,
  }) => shadow.build(x, y, radius * 2, color, showImage ? opacity : 0)};
  background-color: ${({ showImage, theme: { colors } }) =>
    showImage ? colors.white : colors.transparent};
  border-radius: ${({ size }) => size / 2};
  overflow: visible;
`;

function WrappedFallbackImage({
  color,
  elevation = 6,
  shadowOpacity,
  showImage,
  size,
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
        {...props}
        overlayColor={color || colors.dark}
        shadowOpacity={shadowOpacity}
        showImage={showImage}
        size={size}
      />
    </Centered>
  );
}

const FallbackImageElement = android ? WrappedFallbackImage : FallbackImage;

const CoinIconFallback = fallbackProps => {
  const { address = '', height, icon_url, symbol, width } = fallbackProps;

  const [showImage, showFallbackImage, hideFallbackImage] = useBooleanState(
    false
  );

  const fallbackIconColor = useColorForAsset({ address });
  const imageUrl = useMemo(() => {
    if (icon_url) return icon_url;
    return getUrlForTrustIconFallback(address);
  }, [address, icon_url]);

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
        imageUrl={imageUrl}
        onError={hideFallbackImage}
        onLoad={showFallbackImage}
        showImage={showImage}
        size={width}
      />
    </Centered>
  );
};

export default magicMemo(CoinIconFallback, ['address', 'style', 'symbol']);
