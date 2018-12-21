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
import styled from 'styled-components/primitives';
import { buildUniqueTokenName } from '../../helpers/assets';
import { colors, fonts, position } from '../../styles';
import { Centered } from '../layout';
import { Monospace } from '../text';
import Shimmer from '../Shimmer';
import ImageWithCachedDimensions from '../ImageWithCachedDimensions';

const FallbackTextColorVariants = {
  dark: colors.blueGreyLight,
  light: colors.white,
};

const Container = styled(Centered)`
  ${position.cover};
`;

const FallbackText = styled(Monospace).attrs({ size: 'smedium' })`
  line-height: ${fonts.lineHeight.looser};
  text-align: center;
`;

const UniqueTokenImage = ({
  error,
  fallbackTextColor,
  imageUrl,
  isLoading,
  name,
  onError,
  onLoad,
  onLoadStart,
  resizeMode,
  size,
}) => (
  <Container>
    {(imageUrl && !error) ? (
      <ImageWithCachedDimensions
        onError={onError}
        onLoad={onLoad}
        id={imageUrl}
        onLoadStart={onLoadStart}
        resizeMode={FastImage.resizeMode[resizeMode]}
        source={{ uri: imageUrl }}
        style={position.sizeAsObject('100%')}
      />
    ) : (
      <FallbackText color={fallbackTextColor}>
        {name}
      </FallbackText>
    )}
    {isLoading && <Shimmer {...position.sizeAsObject(size)} />}
  </Container>
);

UniqueTokenImage.propTypes = {
  backgroundColor: PropTypes.string,
  error: PropTypes.object,
  fallbackTextColor: PropTypes.string,
  imageUrl: PropTypes.string,
  isLoading: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onError: PropTypes.func,
  onLoad: PropTypes.func,
  onLoadStart: PropTypes.func,
  resizeMode: PropTypes.oneOf(Object.values(FastImage.resizeMode)),
  size: PropTypes.number.isRequired,
};

UniqueTokenImage.defaultProps = {
  resizeMode: 'cover',
};

const getFallbackTextColor = bg => colors.getTextColorForBackground(bg, FallbackTextColorVariants);

export default compose(
  withState('error', 'handleErrorState', null),
  withState('isLoading', 'handleLoadingState', false),
  withHandlers({
    onError: ({ handleErrorState, handleLoadingState }) => (error) => {
      handleErrorState(error);
      handleLoadingState(false);
    },
    onLoad: ({ handleLoadingState }) => () => handleLoadingState(false),
    onLoadStart: ({ handleLoadingState }) => () => handleLoadingState(true),
  }),
  withProps(({ backgroundColor, item }) => ({
    fallbackTextColor: getFallbackTextColor(backgroundColor),
    name: buildUniqueTokenName(item),
  })),
  onlyUpdateForKeys(['error', 'imageUrl', 'isLoading']),
)(UniqueTokenImage);
