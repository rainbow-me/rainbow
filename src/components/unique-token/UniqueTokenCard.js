import PropTypes from 'prop-types';
import React from 'react';
import Piwik from 'react-native-matomo';
import { compose, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, position, shadow } from '../../styles';
import { ButtonPressAnimation } from '../buttons';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import UniqueTokenImage from './UniqueTokenImage';

const UniqueTokenCardBorderRadius = 16;

const Container = styled(Centered)`
  ${position.cover}
  background-color: ${({ backgroundColor }) => backgroundColor};
  border-radius: ${UniqueTokenCardBorderRadius};
`;

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${shadow.color}
  border-radius: ${UniqueTokenCardBorderRadius};
  border-width: 0.68;
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
        borderRadius={UniqueTokenCardBorderRadius}
        shadows={[
          shadow.buildString(0, 3, 5, 'rgba(0,0,0,0.1)'),
          shadow.buildString(0, 6, 10, 'rgba(0,0,0,0.1)'),
        ]}
      >
        <Container backgroundColor={backgroundColor}>
          <UniqueTokenImage
            backgroundColor={backgroundColor}
            imageUrl={image_preview_url}
            item={item}
            size={size}
          />
          <InnerBorder />
        </Container>
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

UniqueTokenCard.propTypes = {
  item: PropTypes.shape({
    background: PropTypes.string,
    image_preview_url: PropTypes.string,
  }),
  onPress: PropTypes.func,
  size: PropTypes.number,
};

export default compose(
  pure,
  withHandlers({
    onPress: ({ item: { name }, onPress }) => () => {
      if (onPress) {
        Piwik.trackEvent('UniqueTokens', 'open', 'OpenUniqueToken');
        onPress(name);
      }
    },
  }),
)(UniqueTokenCard);
