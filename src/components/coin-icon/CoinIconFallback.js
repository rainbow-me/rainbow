import React, { useMemo } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components/primitives';
import ImageWithCachedMetadata from '../ImageWithCachedMetadata';
import { Centered } from '../layout';
import { useBooleanState, useColorForAsset } from '@rainbow-me/hooks';
import { fonts, position } from '@rainbow-me/styles';
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
`;

const CoinIconFallback = fallbackProps => {
  const { address = '', height, symbol, width } = fallbackProps;

  const [
    shouldShowFallbackImage,
    showFallbackImage,
    hideFallbackImage,
  ] = useBooleanState(false);

  const fallbackIconColor = useColorForAsset({ address });

  const imageUrl = useMemo(() => getUrlForTrustIconFallback(address), [
    address,
  ]);

  return (
    <Centered height={height} width={width}>
      <FallbackIcon
        {...fallbackProps}
        color={fallbackIconColor}
        symbol={symbol || ''}
        textStyles={fallbackTextStyles}
      />
      <FallbackImage
        {...fallbackProps}
        color={fallbackIconColor}
        imageUrl={imageUrl}
        onError={hideFallbackImage}
        onLoad={showFallbackImage}
        showFallbackImage={shouldShowFallbackImage}
      />
    </Centered>
  );
};

export default React.memo(CoinIconFallback);
