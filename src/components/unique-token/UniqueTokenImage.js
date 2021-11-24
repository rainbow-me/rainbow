import { toLower } from 'lodash';
import React, { Fragment, useCallback, useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { buildUniqueTokenName } from '../../helpers/assets';
import { ENS_NFT_CONTRACT_ADDRESS } from '../../references';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
import RemoteSvg from '../svg/RemoteSvg';
import { Monospace, Text } from '../text';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import { useDimensions } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';

const FallbackTextColorVariants = (darkMode, colors) => ({
  dark: darkMode
    ? colors.alpha(colors.white, 0.25)
    : colors.alpha(colors.blueGreyDark, 0.5),
  light: darkMode ? colors.alpha(colors.blueGreyDark, 0.25) : colors.white,
});

const getFallbackTextColor = (bg, darkMode, colors) =>
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
  size,
}) => {
  const { isTinyPhone } = useDimensions();
  const isENS =
    toLower(item.asset_contract.address) === toLower(ENS_NFT_CONTRACT_ADDRESS);
  const image = isENS ? `${item.image_url}=s1` : imageUrl;
  const [error, setError] = useState(null);
  const handleError = useCallback(error => setError(error), [setError]);
  const { isDarkMode, colors } = useTheme();
  const isSVG = isSupportedUriExtension(imageUrl, ['.svg']);
  const [loadedImg, setLoadedImg] = useState(false);
  const onLoad = useCallback(() => setLoadedImg(true), [setLoadedImg]);
  const remoteSvgStyle = useMemo(() => {
    // I know... This shit is mad weird :|
    return { height: size + 0.1, width: size + 0.1 };
  }, [size]);

  return (
    <Centered backgroundColor={backgroundColor} style={position.coverAsObject}>
      {isSVG && !error ? (
        <RemoteSvg
          onError={handleError}
          style={remoteSvgStyle}
          uri={imageUrl}
        />
      ) : imageUrl && !error ? (
        <Fragment>
          <ImageTile
            onError={handleError}
            onLoad={onLoad}
            resizeMode={ImgixImage.resizeMode[resizeMode]}
            source={{ uri: image }}
            style={position.coverAsObject}
          >
            {isENS && (
              <ENSText isTinyPhone={isTinyPhone} small={small}>
                {item.name}
              </ENSText>
            )}
          </ImageTile>
          {!loadedImg && lowResUrl && (
            <ImageTile
              resizeMode={ImgixImage.resizeMode[resizeMode]}
              source={{ uri: lowResUrl }}
              style={position.coverAsObject}
            />
          )}
        </Fragment>
      ) : (
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

export default magicMemo(UniqueTokenImage, 'imageUrl');
