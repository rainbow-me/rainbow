import React, { Fragment, useCallback, useState } from 'react';
import { buildUniqueTokenName } from '../../helpers/assets';
import { useTheme } from '../../theme/ThemeContext';
import { Centered } from '../layout';
import RemoteSvg from '../svg/RemoteSvg';
import { Monospace } from '../text';
import svgToPngIfNeeded from '@rainbow-me/handlers/svgs';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import { ImgixImage } from '@rainbow-me/images';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

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

const UniqueTokenImage = ({
  backgroundColor: givenBackgroundColor,
  imageUrl,
  item,
  isCard = false,
  resizeMode = ImgixImage.resizeMode.cover,
  size,
  transformSvgs = true,
}) => {
  const isSVG = isSupportedUriExtension(imageUrl, ['.svg']);
  const [error, setError] = useState(null);
  const handleError = useCallback(error => setError(error), [setError]);
  const { isDarkMode, colors } = useTheme();
  const [loadedImg, setLoadedImg] = useState(false);
  const onLoad = useCallback(() => setLoadedImg(true), [setLoadedImg]);
  let backgroundColor = givenBackgroundColor;

  return (
    <Centered backgroundColor={backgroundColor} style={position.coverAsObject}>
      {isSVG && !transformSvgs && !error ? (
        <RemoteSvg
          fallbackIfNonAnimated
          fallbackUri={svgToPngIfNeeded(imageUrl, true)}
          lowResFallbackUri={item.lowResUrl}
          onError={handleError}
          resizeMode={resizeMode}
          style={position.coverAsObject}
          uri={item.image_url}
        />
      ) : imageUrl && !error ? (
        <Fragment>
          <ImageTile
            {...(isCard && { fm: 'png' })}
            onError={handleError}
            onLoad={onLoad}
            resizeMode={ImgixImage.resizeMode[resizeMode]}
            size={size}
            source={{ uri: imageUrl }}
            style={position.coverAsObject}
          />
          {!loadedImg && (
            <ImageTile
              fm="png"
              playing={false}
              resizeMode={ImgixImage.resizeMode[resizeMode]}
              source={{ uri: item.lowResUrl }}
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

export default UniqueTokenImage;
