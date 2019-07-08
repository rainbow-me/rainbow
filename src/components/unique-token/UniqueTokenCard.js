import PropTypes from 'prop-types';
import React from 'react';
import stylePropType from 'react-style-proptype';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import UniqueTokenImage from './UniqueTokenImage';

const UniqueTokenCardBorderRadius = 18;

const enhance = compose(
  onlyUpdateForKeys(['height', 'style', 'uniqueId', 'width']),
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
  style,
  width,
  ...props
}) => {
  const backgroundColor = background || colors.lightestGrey;

  return (
    <ButtonPressAnimation
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.94}
    >
      <ShadowStack
        {...props}
        backgroundColor={backgroundColor}
        borderRadius={UniqueTokenCardBorderRadius}
        height={height}
        shadows={shadows}
        style={style}
        width={width}
      >
        <Centered
          style={{
            ...position.coverAsObject,
            backgroundColor,
            borderRadius: UniqueTokenCardBorderRadius,
          }}
        >
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
        </Centered>
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
  style: stylePropType,
  width: PropTypes.number,
};

UniqueTokenCard.defaultProps = {
  shadows: [
    [0, 1, 3, colors.dark, 0.06],
    [0, 4, 6, colors.dark, 0.04],
  ],
};

export default UniqueTokenCard;
