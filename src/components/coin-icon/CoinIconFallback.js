import React, { useMemo } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components/primitives';
import ImageWithCachedMetadata from '../ImageWithCachedMetadata';
import { Centered } from '../layout';
import { useBooleanState, useColorForAsset } from '@rainbow-me/hooks';
import { colors, fonts, position } from '@rainbow-me/styles';
import {
  getTokenMetadata,
  getUrlForTrustIconFallback,
} from '@rainbow-me/utils';

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const FallbackImage = styled(ImageWithCachedMetadata)`
  ${position.cover};
  background-color: ${({ showImage }) =>
    showImage ? colors.white : colors.transparent};
  border-radius: ${({ size }) => size / 2};
  overflow: visible;
  shadow-color: ${({ shadowColorValue }) => shadowColorValue};
  shadow-offset: ${({ shadowOffsetHeight, shadowOffsetWidth }) =>
    `${shadowOffsetWidth}px ${shadowOffsetHeight}px`};
  shadow-opacity: ${({ shadowOpacityValue, showImage }) =>
    showImage ? shadowOpacityValue : 0};
  shadow-radius: ${({ shadowRadiusValue }) => shadowRadiusValue};
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

  const tokenMetadata = getTokenMetadata(address);
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
        shadowColorValue={tokenMetadata?.extensions?.shadowColor || shadowColor}
        shadowOffsetHeight={shadowOffset.height}
        shadowOffsetWidth={shadowOffset.width}
        shadowOpacityValue={shadowOpacity}
        shadowRadiusValue={shadowRadius}
        showImage={showImage}
        size={width}
      />
    </Centered>
  );
};

export default React.memo(CoinIconFallback);
