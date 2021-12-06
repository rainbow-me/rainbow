import React, { useMemo } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { FallbackIcon } from 'react-coin-icon';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useBooleanState, useColorForAsset } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImageWithCachedMetadata } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, fonts, position, shadow } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
}: any) {
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered
      {...props}
      {...position.coverAsObject}
      {...borders.buildCircleAsObject(size)}
      backgroundColor={colors.alpha(color || colors.dark, shadowOpacity || 0.3)}
      elevation={showImage ? elevation : 0}
      style={{ overflow: 'hidden' }}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const FallbackImageElement = android ? WrappedFallbackImage : FallbackImage;

const CoinIconFallback = (fallbackProps: any) => {
  const { address = '', height, symbol, width } = fallbackProps;

  const [showImage, showFallbackImage, hideFallbackImage] = useBooleanState(
    false
  );

  const fallbackIconColor = useColorForAsset({ address });
  const imageUrl = useMemo(() => getUrlForTrustIconFallback(address), [
    address,
  ]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered height={height} width={width}>
      {!showImage && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <FallbackIcon
          {...fallbackProps}
          color={fallbackIconColor}
          showImage={showImage}
          symbol={symbol || ''}
          textStyles={fallbackTextStyles}
        />
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
