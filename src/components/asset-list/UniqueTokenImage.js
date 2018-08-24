import PropTypes from 'prop-types';
import React from 'react';
import { Image } from 'react-primitives';
import { compose, withHandlers, withProps, withState } from 'recompact';
import styled from 'styled-components/primitives';
import { fonts, padding, position } from '../../styles';
import { Centered } from '../layout';
import { Monospace } from '../text';
import Shimmer from '../Shimmer';

const Container = styled(Centered)`
  ${padding(19, 10)}
  ${position.cover}
`;

const FallbackText = styled(Monospace).attrs({
  color: 'blueGreyLight',
  size: 'smedium',
})`
  line-height: ${fonts.lineHeight.loose};
  text-align: center;
`;

const UniqueTokenImage = ({
  error,
  imageUrl,
  isLoading,
  name,
  onError,
  onLoad,
  onLoadStart,
  size,
  ...props
}) => (
  <Container>
    {(imageUrl && !error) ? (
      <Image
        onError={onError}
        onLoad={onLoad}
        onLoadStart={onLoadStart}
        resizeMode="contain"
        source={{ uri: imageUrl }}
        style={position.sizeAsObject('100%')}
      />
    ) : (
      <FallbackText>{name}</FallbackText>
    )}
    {isLoading && <Shimmer {...position.sizeAsObject(size)} />}
  </Container>
);

UniqueTokenImage.propTypes = {
  error: PropTypes.object,
  imageUrl: PropTypes.string,
  isLoading: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onError: PropTypes.func,
  onLoad: PropTypes.func,
  onLoadStart: PropTypes.func,
  size: PropTypes.number,
};

const buildUniqueTokenName = ({ contractName, id, name }) => (name || `${contractName} #${id}`);

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
  withProps(({ item }) => ({ name: buildUniqueTokenName(item) })),
)(UniqueTokenImage);
