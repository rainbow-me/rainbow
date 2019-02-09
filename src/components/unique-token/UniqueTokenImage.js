import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import {
  compose,
  onlyUpdateForKeys,
  pure,
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

const UniqueTokenImage = ({
  backgroundColor,
  borderRadius,
  error,
  fallbackTextColor,
  imageUrl,
  name,
  onError,
  resizeMode,
  size,
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
);

UniqueTokenImage.propTypes = {
  backgroundColor: PropTypes.string,
  borderRadius: PropTypes.number,
  error: PropTypes.object,
  fallbackTextColor: PropTypes.string,
  imageUrl: PropTypes.string,
  name: PropTypes.string.isRequired,
  onError: PropTypes.func,
  resizeMode: PropTypes.oneOf(Object.values(FastImage.resizeMode)),
  size: PropTypes.number.isRequired,
};

UniqueTokenImage.defaultProps = {
  borderRadius: 0,
  resizeMode: 'cover',
};

const getFallbackTextColor = bg => colors.getTextColorForBackground(bg, FallbackTextColorVariants);

export default compose(
  pure,
  withState('error', 'handleErrorState', null),
  withHandlers({
    onError: ({ handleErrorState }) => (error) => handleErrorState(error),
  }),
  withProps(({ backgroundColor, item }) => ({
    fallbackTextColor: getFallbackTextColor(backgroundColor),
    name: buildUniqueTokenName(item),
  })),
  onlyUpdateForKeys(['error', 'imageUrl']),
)(UniqueTokenImage);
