import { toLower } from 'lodash';
import React, { Fragment, useCallback, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { buildUniqueTokenName } from '../../helpers/assets';
import { ENS_NFT_CONTRACT_ADDRESS } from '../../references';
import { Centered } from '../layout';
import RemoteSvg from '../svg/RemoteSvg';
import { Monospace, Text } from '../text';
import svgToPngIfNeeded from '@rainbow-me/handlers/svgs';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useDimensions,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { fonts, fontWithWidth, position } from '@rainbow-me/styles';
import styled from 'rainbowed-components';

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

const ImageTile = styled(ImgixImage)({
  alignItems: 'center',
  justifyContent: 'center',
});

const ENSText = styled(Text).attrs(
  ({ isTinyPhone, small, theme: { colors } }) => ({
    color: colors.whiteLabel,
    letterSpacing: 'roundedMedium',
    size: small ? 'smedium' : isTinyPhone ? 'large' : 'bigger',
  })
)({
  padding: 8,
  textAlign: 'center',
  ...fontWithWidth(fonts.weight.heavy),
});

const UniqueTokenImage = ({
  backgroundColor: givenBackgroundColor,
  imageUrl,
  item,
  isCard = false,
  lowResUrl,
  resizeMode = ImgixImage.resizeMode.cover,
  small,
  transformSvgs = true,
}) => {
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
  let backgroundColor = givenBackgroundColor;
  const { result: dominantColor } = usePersistentDominantColorFromImage(
    item.image_url
  );

  const isOldENS = isENS && !isSVG;

  if (isOldENS && dominantColor) {
    backgroundColor = dominantColor;
  }

  return (
    <Centered backgroundColor={backgroundColor} style={position.coverAsObject}>
      {isSVG && !transformSvgs && !error ? (
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
        isOldENS ? (
          <ENSText isTinyPhone={isTinyPhone} small={small}>
            {item.name}
          </ENSText>
        ) : (
          <Fragment>
            <ImageTile
              {...(isCard && { fm: 'png' })}
              onError={handleError}
              onLoad={onLoad}
              resizeMode={ImgixImage.resizeMode[resizeMode]}
              source={{ uri: image }}
              style={position.coverAsObject}
            />
            {!loadedImg && lowResUrl && (
              <ImageTile
                {...(isCard && { fm: 'png' })}
                playing={false}
                resizeMode={ImgixImage.resizeMode[resizeMode]}
                source={{ uri: lowResUrl }}
                style={position.coverAsObject}
              />
            )}
          </Fragment>
        )
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

export default UniqueTokenImage;
