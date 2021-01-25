import React, { useCallback, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { buildUniqueTokenName } from '../../helpers/assets';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
import { Monospace } from '../text';
import { ImageWithCachedMetadata, ImgixImage } from '@rainbow-me/images';
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

const UniqueTokenImage = ({
  backgroundColor,
  imageUrl,
  item,
  resizeMode = ImgixImage.resizeMode.cover,
}) => {
  const [error, setError] = useState(null);
  const handleError = useCallback(error => setError(error), [setError]);
  const { isDarkMode, colors } = useTheme();

  return (
    <Centered backgroundColor={backgroundColor} style={position.coverAsObject}>
      {imageUrl && !error ? (
        <ImageWithCachedMetadata
          imageUrl={imageUrl}
          onError={handleError}
          resizeMode={ImgixImage.resizeMode[resizeMode]}
          style={position.coverAsObject}
        />
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
