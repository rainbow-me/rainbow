import PropTypes from 'prop-types';
import React from 'react';
import stylePropType from 'react-style-proptype';
import { compose, onlyUpdateForKeys, withHandlers, withProps } from 'recompact';
import { withFabSendAction } from '../../hoc';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Highlight from '../Highlight';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
import { ShadowStack } from '../shadow-stack';
import UniqueTokenImage from './UniqueTokenImage';

const UniqueTokenCardBorderRadius = 18;

const UniqueTokenCard = ({
  disabled,
  height,
  item: { background, image_preview_url, ...item },
  onPress,
  onPressSend,
  highlight,
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
      onPressSend={onPressSend}
      scaleTo={0.96}
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
            imageUrl={image_preview_url}
            item={item}
          />
          <InnerBorder opacity={0.04} radius={UniqueTokenCardBorderRadius} />
          <Highlight
            backgroundColor={colors.alpha(colors.white, 0.33)}
            visible={highlight}
          />
        </Centered>
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

UniqueTokenCard.propTypes = {
  disabled: PropTypes.bool,
  height: PropTypes.number,
  highlight: PropTypes.bool,
  item: PropTypes.shape({
    background: PropTypes.string,
    image_preview_url: PropTypes.string,
  }),
  onPress: PropTypes.func,
  onPressSend: PropTypes.func,
  resizeMode: UniqueTokenImage.propTypes.resizeMode,
  shadows: PropTypes.array,
  size: PropTypes.number,
  style: stylePropType,
  width: PropTypes.number,
};

UniqueTokenCard.defaultProps = {
  shadows: [
    [0, 1, 3, colors.dark, 0.06],
    [0, 4, 6, colors.dark, 0.04],
  ],
};

export default compose(
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
    onPressSend: ({ item, onPressSend }) => () => {
      if (onPressSend) {
        onPressSend(item);
      }
    },
  }),
  withProps(({ item: { uniqueId } }) => ({ uniqueId })),
  withFabSendAction,
  onlyUpdateForKeys(['height', 'style', 'uniqueId', 'width', 'highlight'])
)(UniqueTokenCard);
