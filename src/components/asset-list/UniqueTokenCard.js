import PropTypes from 'prop-types';
import React from 'react';
import { compose, withHandlers, withProps, withState } from 'recompact';
import styled from 'styled-components/primitives';
import { fonts, padding, position, shadow } from '../../styles';
import { Centered } from '../layout';
import { Monospace } from '../text';
import { ShadowStack } from '../shadow-stack';
import Shimmer from '../Shimmer';

const UniqueTokenCardBorderRadius = 16;

const Container = styled(Centered)`
  ${padding(19, 10)}
  ${position.cover}
  border-radius: ${UniqueTokenCardBorderRadius};
  background-color: ${({ background }) => background};
`;

const FallbackText = styled(Monospace).attrs({
  color: 'blueGreyLight',
  size: 'smedium',
})`
  line-height: ${fonts.lineHeight.loose};
  text-align: center;
`;

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${shadow.color}
  border-radius: ${UniqueTokenCardBorderRadius};
  border-width: 0.68;
`;

const UniqueTokenImage = styled.Image`
  ${position.size('100%')}
`;

const UniqueTokenCard = ({
  item: {
    background,
    imageUrl,
  },
  error,
  isLoading,
  name,
  onError,
  onLoad,
  onLoadStart,
  size,
  ...props
}) => (
  <ShadowStack
    {...props}
    {...position.sizeAsObject(size)}
    borderRadius={UniqueTokenCardBorderRadius}
    shadows={[
      shadow.buildString(0, 3, 5, 'rgba(0,0,0,0.1)'),
      shadow.buildString(0, 6, 10, 'rgba(0,0,0,0.1)'),
    ]}
  >
    <Container background={background}>
      {(imageUrl && !error) ? (
        <UniqueTokenImage
          onError={onError}
          onLoad={onLoad}
          onLoadStart={onLoadStart}
          resizeMode="contain"
          source={{ uri: imageUrl }}
        />
      ) : (
        <FallbackText>{name}</FallbackText>
      )}
      {isLoading && <Shimmer {...position.sizeAsObject(size)} />}
      <InnerBorder />
    </Container>
  </ShadowStack>
);

UniqueTokenCard.propTypes = {
  error: PropTypes.object,
  isLoading: PropTypes.bool,
  item: PropTypes.shape({
    background: PropTypes.string,
    imageUrl: PropTypes.string,
  }),
  name: PropTypes.string.isRequired,
  onError: PropTypes.func,
  onLoad: PropTypes.func,
  onLoadStart: PropTypes.func,
  size: PropTypes.number,
};

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
  withProps(({ item: { contractName, id, name } }) => ({
    name: name || `${contractName} #${id}`,
  })),
)(UniqueTokenCard);
