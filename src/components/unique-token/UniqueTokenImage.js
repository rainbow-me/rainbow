import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { buildUniqueTokenName } from '../../helpers/assets';
import { colors, position } from '../../styles';
import { Centered } from '../layout';
import { Monospace } from '../text';
import ImageWithCachedDimensions from '../ImageWithCachedDimensions';

const FallbackTextColorVariants = {
  dark: colors.blueGreyLight,
  light: colors.white,
};

const getFallbackTextColor = bg => colors.getTextColorForBackground(bg, FallbackTextColorVariants);

const enhance = compose(
  withState('error', 'handleErrorState', null),
  withHandlers({ onError: ({ handleErrorState }) => error => handleErrorState(error) }),
  withProps(({ backgroundColor, item }) => ({
    fallbackTextColor: getFallbackTextColor(backgroundColor),
    name: buildUniqueTokenName(item),
  })),
  onlyUpdateForKeys(['error', 'imageUrl']),
);

const UniqueTokenImage = enhance(({
  backgroundColor,
  borderRadius,
  error,
  fallbackTextColor,
  imageUrl,
  name,
  onError,
  resizeMode,
}) => (
  <Centered shouldRasterizeIOS style={{ ...position.coverAsObject, backgroundColor }}>
    {(imageUrl && !error) ? (
      <ImageWithCachedDimensions
        id={imageUrl}
        onError={onError}
        resizeMode={FastImage.resizeMode[resizeMode]}
        source={{ uri: imageUrl }}
        style={position.coverAsObject}
      />
    ) : (
      <Monospace
        align="center"
        color={fallbackTextColor}
        lineHeight="looser"
        size="smedium"
      >
        {name}
      </Monospace>
    )}
  </Centered>
));

UniqueTokenImage.propTypes = {
  backgroundColor: PropTypes.string,
  borderRadius: PropTypes.number,
  error: PropTypes.object,
  fallbackTextColor: PropTypes.string,
  imageUrl: PropTypes.string,
  name: PropTypes.string,
  onError: PropTypes.func,
  resizeMode: PropTypes.oneOf(Object.values(FastImage.resizeMode)),
};

UniqueTokenImage.defaultProps = {
  borderRadius: 0,
  resizeMode: 'cover',
};

export default UniqueTokenImage;
