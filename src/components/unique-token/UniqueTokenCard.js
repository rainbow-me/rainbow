import PropTypes from 'prop-types';
import React from 'react';
import Piwik from 'react-native-matomo';
import { compose, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import UniqueTokenImage from './UniqueTokenImage';

const UniqueTokenCardBorderRadius = 16;

const Container = styled(Centered)`
  ${position.cover};
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${UniqueTokenCardBorderRadius};
`;

const UniqueTokenCard = ({
  item: {
    background,
    image_preview_url,
    ...item
  },
  onPress,
  size,
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
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

UniqueTokenCard.propTypes = {
  item: PropTypes.shape({
    background: PropTypes.string,
    // eslint-disable-next-line camelcase
    image_preview_url: PropTypes.string,
  }),
  onPress: PropTypes.func,
  size: PropTypes.number,
};

export default compose(
  pure,
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        Piwik.trackEvent('UniqueTokens', 'open', 'OpenUniqueToken');
        onPress(item);
      }
    },
  }),
)(UniqueTokenCard);
