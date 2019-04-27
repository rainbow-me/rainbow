import PropTypes from 'prop-types';
import React from 'react';
import { compose, shouldUpdate, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import { isNewValueForPath } from '../../utils';
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

const enhance = compose(
  shouldUpdate((...props) => isNewValueForPath(...props, 'uniqueId')),
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
  }),
);

const UniqueTokenCard = enhance(({
  disabled,
  height,
  item: {
    background,
    image_preview_url,
    ...item
  },
  onPress,
  resizeMode,
  shadows,
  width,
  ...props
}) => {
  const backgroundColor = background || colors.lightestGrey;

  return (
    <ButtonPressAnimation
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.96}
    >
      <ShadowStack
        {...props}
        backgroundColor={backgroundColor}
        borderRadius={UniqueTokenCardBorderRadius}
        height={height}
        shadows={shadows}
        width={width}
      >
        <Container backgroundColor={backgroundColor} shouldRasterizeIOS>
          <UniqueTokenImage
            backgroundColor={backgroundColor}
            resizeMode={resizeMode}
            imageUrl={image_preview_url} // eslint-disable-line camelcase
            item={item}
          />
          <InnerBorder
            opacity={0.04}
            radius={UniqueTokenCardBorderRadius}
          />
        </Container>
      </ShadowStack>
    </ButtonPressAnimation>
  );
});

UniqueTokenCard.propTypes = {
  disabled: PropTypes.bool,
  height: PropTypes.number,
  item: PropTypes.shape({
    background: PropTypes.string,
    // eslint-disable-next-line camelcase
    image_preview_url: PropTypes.string,
  }),
  onPress: PropTypes.func,
  resizeMode: UniqueTokenImage.propTypes.resizeMode,
  shadows: PropTypes.array,
  width: PropTypes.number,
};

UniqueTokenCard.defaultProps = {
  shadows: [
    [0, 3, 5, colors.black, 0.04],
    [0, 6, 10, colors.black, 0.04],
  ],
};

export default UniqueTokenCard;
