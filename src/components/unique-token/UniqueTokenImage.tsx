import { toLower } from 'lodash';
import React, { Fragment, useCallback, useState } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { buildUniqueTokenName } from '../../helpers/assets';
import { ENS_NFT_CONTRACT_ADDRESS } from '../../references';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../svg/RemoteSvg' was resolved to '/Users/... Remove this comment to see the full error message
import RemoteSvg from '../svg/RemoteSvg';
import { Monospace, Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/svgs' or ... Remove this comment to see the full error message
import svgToPngIfNeeded from '@rainbow-me/handlers/svgs';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isSupporte... Remove this comment to see the full error message
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'darkMode' implicitly has an 'any' type.
const FallbackTextColorVariants = (darkMode, colors) => ({
  dark: darkMode
    ? colors.alpha(colors.white, 0.25)
    : colors.alpha(colors.blueGreyDark, 0.5),

  light: darkMode ? colors.alpha(colors.blueGreyDark, 0.25) : colors.white,
});

const getFallbackTextColor = (bg: any, darkMode: any, colors: any) =>
  colors.getTextColorForBackground(
    bg,
    FallbackTextColorVariants(darkMode, colors)
  );

const ImageTile = styled(ImgixImage)`
  align-items: center;
  justify-content: center;
`;

const ENSText = styled(Text).attrs(
  ({ isTinyPhone, small, theme: { colors } }) => ({
    color: colors.whiteLabel,
    letterSpacing: 'roundedMedium',
    size: small ? 'smedium' : isTinyPhone ? 'large' : 'bigger',
  })
)`
  padding: 8px;
  text-align: center;
  ${fontWithWidth(fonts.weight.heavy)};
`;

const UniqueTokenImage = ({
  backgroundColor,
  imageUrl,
  item,
  lowResUrl,
  resizeMode = ImgixImage.resizeMode.cover,
  small,
  transformSvgs = true,
}: any) => {
  const { isTinyPhone } = useDimensions();
  const isENS =
    toLower(item.asset_contract.address) === toLower(ENS_NFT_CONTRACT_ADDRESS);
  const isSVG = isSupportedUriExtension(imageUrl, ['.svg']);
  const newImageUrl = transformSvgs ? svgToPngIfNeeded(imageUrl) : imageUrl;
  const image = isENS && !isSVG ? `${item.image_url}=s1` : newImageUrl;
  const [error, setError] = useState(null);
  const handleError = useCallback(error => setError(error), [setError]);
  const { isDarkMode, colors } = useTheme();
  const [loadedImg, setLoadedImg] = useState(false);
  const onLoad = useCallback(() => setLoadedImg(true), [setLoadedImg]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered backgroundColor={backgroundColor} style={position.coverAsObject}>
      {isSVG && !transformSvgs && !error ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <RemoteSvg
          fallbackIfNonAnimated
          fallbackUri={svgToPngIfNeeded(imageUrl, true)}
          lowResFallbackUri={svgToPngIfNeeded(imageUrl)}
          onError={handleError}
          resizeMode={resizeMode}
          style={position.coverAsObject}
          uri={item.image_url}
        />
      ) : imageUrl && !error ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Fragment>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ImageTile
            onError={handleError}
            onLoad={onLoad}
            resizeMode={ImgixImage.resizeMode[resizeMode]}
            source={{ uri: image }}
            style={position.coverAsObject}
          >
            {isENS && !isSVG && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <ENSText isTinyPhone={isTinyPhone} small={small}>
                {item.name}
              </ENSText>
            )}
          </ImageTile>
          {!loadedImg && lowResUrl && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ImageTile
              playing={false}
              resizeMode={ImgixImage.resizeMode[resizeMode]}
              source={{ uri: lowResUrl }}
              style={position.coverAsObject}
            />
          )}
        </Fragment>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Monospace
          align="center"
          color={getFallbackTextColor(backgroundColor, isDarkMode, colors)}
          lineHeight="looser"
          size="smedium"
        >
          {buildUniqueTokenName(item)}
        </Monospace>
      )}
    </Centered>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(UniqueTokenImage, 'imageUrl');
