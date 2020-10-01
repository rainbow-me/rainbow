import React, { useCallback, useState } from 'react';
import FastImage from 'react-native-fast-image';
import { buildUniqueTokenName } from '../../helpers/assets';
import { magicMemo } from '../../utils';
import ImageWithCachedMetadata from '../ImageWithCachedMetadata';
import { Centered } from '../layout';
import { Monospace } from '../text';
import { colors, position } from '@rainbow-me/styles';

const FallbackTextColorVariants = {
  dark: colors.alpha(colors.blueGreyDark, 0.5),
  light: colors.white,
};

const getFallbackTextColor = bg =>
  colors.getTextColorForBackground(bg, FallbackTextColorVariants);

const UniqueTokenImage = ({
  backgroundColor,
  imageUrl,
  item,
  resizeMode = FastImage.resizeMode.cover,
}) => {
  const [error, setError] = useState(null);
  const handleError = useCallback(error => setError(error), [setError]);

  return (
    <Centered backgroundColor={backgroundColor} style={position.coverAsObject}>
      {imageUrl && !error ? (
        <ImageWithCachedMetadata
          imageUrl={imageUrl}
          onError={handleError}
          resizeMode={FastImage.resizeMode[resizeMode]}
          style={position.coverAsObject}
        />
      ) : (
        <Monospace
          align="center"
          color={getFallbackTextColor(backgroundColor)}
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
