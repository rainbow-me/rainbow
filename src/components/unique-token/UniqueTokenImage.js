import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import FastImage from 'react-native-fast-image';
import { buildUniqueTokenName } from '../../helpers/assets';
import { colors, position } from '../../styles';
import ImageWithCachedDimensions from '../ImageWithCachedDimensions';
import { Centered } from '../layout';
import { Monospace } from '../text';

const FallbackTextColorVariants = {
  dark: colors.alpha(colors.blueGreyDark, 0.5),
  light: colors.white,
};

const getFallbackTextColor = bg =>
  colors.getTextColorForBackground(bg, FallbackTextColorVariants);

const UniqueTokenImage = ({ backgroundColor, imageUrl, item, resizeMode }) => {
  const [error, setError] = useState(null);
  const handleError = useCallback(error => setError(error), [setError]);
  const source = useMemo(() => ({ uri: imageUrl }), [imageUrl]);

  return (
    <Centered {...position.coverAsObject} backgroundColor={backgroundColor}>
      {imageUrl && !error ? (
        <ImageWithCachedDimensions
          id={imageUrl}
          onError={handleError}
          resizeMode={FastImage.resizeMode[resizeMode]}
          source={source}
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

UniqueTokenImage.propTypes = {
  backgroundColor: PropTypes.string,
  imageUrl: PropTypes.string,
  resizeMode: PropTypes.oneOf(Object.values(FastImage.resizeMode)),
};

UniqueTokenImage.defaultProps = {
  borderRadius: 0,
  resizeMode: 'cover',
};

const arePropsEqual = (prev, next) => prev.imageUrl === next.imageUrl;

export default React.memo(UniqueTokenImage, arePropsEqual);
