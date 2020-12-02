import React, { useMemo } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components/primitives';
import ImageWithCachedMetadata from '../ImageWithCachedMetadata';
import { Centered } from '../layout';
import { useBooleanState, useColorForAsset } from '@rainbow-me/hooks';
import { colors, fonts, position, shadow } from '@rainbow-me/styles';
import { getUrlForTrustIconFallback } from '@rainbow-me/utils';

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
  }) => shadow.build(x, y, radius, color, showImage ? opacity : 0)}
  background-color: ${({ showImage }) =>
    showImage ? colors.white : colors.transparent};
  border-radius: ${({ size }) => size / 2};
  overflow: visible;
`;

const CoinIconFallback = fallbackProps => {
  const {
    address = '',
    height,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    symbol,
    width,
  } = fallbackProps;

  const [showImage, showFallbackImage, hideFallbackImage] = useBooleanState(
    false
  );

  const fallbackIconColor = useColorForAsset({ address });
  const imageUrl = useMemo(() => getUrlForTrustIconFallback(address), [
    address,
  ]);

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
      <FallbackImage
        borderRadius={width / 2}
        imageUrl={imageUrl}
        onError={hideFallbackImage}
        onLoad={showFallbackImage}
        shadowColor={shadowColor}
        shadowOffset={shadowOffset}
        shadowOpacity={shadowOpacity}
        shadowRadius={shadowRadius}
        showImage={showImage}
        size={width}
      />
    </Centered>
  );
};

export default React.memo(CoinIconFallback);
