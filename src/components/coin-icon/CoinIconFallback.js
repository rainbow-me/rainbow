import React, { useCallback, useMemo, useState } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components/primitives';
import { useImageMetadata } from '../../hooks';
import {
  getUrlForTrustIconFallback,
  pseudoRandomArrayItemFromString,
} from '../../utils';
import ImageWithCachedMetadata from '../ImageWithCachedMetadata';
import { Centered } from '../layout';
import { colors, fonts, position } from '@rainbow-me/styles';

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const FallbackImage = styled(ImageWithCachedMetadata)`
  ${position.cover};
  background-color: ${({ showFallbackImage }) =>
    showFallbackImage ? colors.white : colors.transparent};
`;

const CoinIconFallback = fallbackProps => {
  const { bgColor, height, width, address, symbol } = fallbackProps;

  const [showFallbackImage, setShowFallbackImage] = useState(true);
  const handleError = useCallback(() => setShowFallbackImage(false), []);
  const handleLoad = useCallback(() => setShowFallbackImage(true), []);

  const imageUrl = useMemo(() => getUrlForTrustIconFallback(address), [
    address,
  ]);

  const { color: imageColor } = useImageMetadata(imageUrl);
  const fallbackIconColor = useMemo(
    () =>
      imageColor ||
      bgColor ||
      pseudoRandomArrayItemFromString(symbol, colors.avatarColor),
    [bgColor, imageColor, symbol]
  );

  return (
    <Centered height={height} width={width}>
      <FallbackIcon
        {...fallbackProps}
        bgColor={fallbackIconColor}
        symbol={symbol || ''}
        textStyles={fallbackTextStyles}
      />
      <FallbackImage
        {...fallbackProps}
        imageUrl={imageUrl}
        onError={handleError}
        onLoad={handleLoad}
        showFallbackImage={showFallbackImage}
      />
    </Centered>
  );
};

export default React.memo(CoinIconFallback);
