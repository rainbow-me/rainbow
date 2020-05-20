import React, { useCallback, useMemo, useState } from 'react';
import { FallbackIcon } from 'react-coin-icon';
import FastImage from 'react-native-fast-image';
import styled, { css } from 'styled-components/primitives';
import { toChecksumAddress } from '../../handlers/web3';
import { colors, fonts, position } from '../../styles';
import { Centered } from '../layout';

const fallbackTextStyles = css`
  font-family: ${fonts.family.SFProRounded};
  letter-spacing: ${fonts.letterSpacing.roundedTight};
  margin-bottom: 1;
  text-align: center;
`;

const FallbackImage = styled(FastImage)`
  ${position.cover};
  background-color: ${colors.white};
  opacity: ${({ showFallbackImage }) => (showFallbackImage ? 1 : 0)};
`;

const getFallbackIconUrl = address => {
  const checksummedAddress = toChecksumAddress(address);
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checksummedAddress}/logo.png`;
};

const CoinIconFallback = fallbackProps => {
  const { bgColor, height, width, address, symbol } = fallbackProps;
  const [showFallbackImage, setShowFallbackImage] = useState(false);
  const handleError = useCallback(() => setShowFallbackImage(false), []);
  const handleLoad = useCallback(() => setShowFallbackImage(true), []);

  const fallbackImageSource = useMemo(
    () => ({
      cache: FastImage.cacheControl.web,
      uri: getFallbackIconUrl(address),
    }),
    [address]
  );

  return (
    <Centered height={height} width={width}>
      <FallbackIcon
        {...fallbackProps}
        bgColor={bgColor || colors.blueGreyDark}
        opacity={showFallbackImage ? 0 : 1}
        symbol={symbol || ''}
        textStyles={fallbackTextStyles}
      />
      <FallbackImage
        {...fallbackProps}
        onError={handleError}
        onLoad={handleLoad}
        showFallbackImage={showFallbackImage}
        source={fallbackImageSource}
      />
    </Centered>
  );
};

export default React.memo(CoinIconFallback);
