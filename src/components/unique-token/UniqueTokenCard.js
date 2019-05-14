import PropTypes from 'prop-types';
import React from 'react';
import {
  compose, shouldUpdate, withHandlers, withProps,
} from 'recompact';
import connect from 'react-redux/es/connect/connect';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import UniqueTokenImage from './UniqueTokenImage';
import Highlight from '../Highlight';
import { withFabSendAction } from '../../hoc';

const UniqueTokenCardBorderRadius = 16;

const Container = styled(Centered)`
  ${position.cover};
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${UniqueTokenCardBorderRadius};
`;

const Shadow = styled(Highlight)`
  background-color: ${({ highlight }) => (highlight ? '#FFFFFF55' : colors.transparent)};
`;


const UniqueTokenCard = ({
  item: {
    background,
    image_preview_url,
    ...item
  },
  onPress,
  size,
  highlight,
  ...props
}) => {
  const backgroundColor = background || colors.lightestGrey;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <ShadowStack
        {...props}
        {...position.sizeAsObject(size)}
        backgroundColor={backgroundColor}
        borderRadius={UniqueTokenCardBorderRadius}
        shadows={[
          [0, 3, 5, colors.black, 0.04],
          [0, 6, 10, colors.black, 0.04],
        ]}
      >
        <Container backgroundColor={backgroundColor} shouldRasterizeIOS>
          <UniqueTokenImage
            backgroundColor={backgroundColor}
            imageUrl={image_preview_url} // eslint-disable-line camelcase
            item={item}
            size={size}
          />
          <InnerBorder
            opacity={0.04}
            radius={UniqueTokenCardBorderRadius}
          />
        </Container>
        <Shadow highlight={highlight}/>
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

UniqueTokenCard.propTypes = {
  highlight: PropTypes.bool,
  item: PropTypes.shape({
    background: PropTypes.string,
    // eslint-disable-next-line camelcase
    image_preview_url: PropTypes.string,
  }),
  onPress: PropTypes.func,
  size: PropTypes.number,
};

const mapStateToProps = ({
  selectedWithFab: {
    selectedId,
  },
}) => ({
  selectedId,
});


export default compose(
  shouldUpdate((...props) => isNewValueForPath(...props, 'uniqueId')),
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
  }),
  connect(mapStateToProps),
  withProps(({ item: { uniqueId } }) => ({ uniqueId })),
  withFabSendAction,
)(UniqueTokenCard);
