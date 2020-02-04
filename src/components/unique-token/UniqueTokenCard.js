import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import stylePropType from 'react-style-proptype';
import { compose, onlyUpdateForKeys, withHandlers, withProps } from 'recompact';
import { withFabSendAction } from '../../hoc';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import Highlight from '../Highlight';
import UniqueTokenImage from './UniqueTokenImage';

const UniqueTokenCardBorderRadius = 18;

const UniqueTokenCard = ({
  borderEnabled,
  disabled,
  height,
  highlight,
  item: { background, image_preview_url, ...item },
  onPress,
  resizeMode,
  shadowStyle,
  style,
  width,
  ...props
}) => {
  return (
    <ButtonPressAnimation
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.96}
      style={{
        shadowColor: colors.dark,
        shadowOffset: { height: 2, width: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        ...shadowStyle,
      }}
    >
      <View
        {...props}
        borderRadius={UniqueTokenCardBorderRadius}
        height={height}
        overflow="hidden"
        style={style}
        width={width}
      >
        <UniqueTokenImage
          backgroundColor={background || colors.lightestGrey}
          imageUrl={image_preview_url}
          item={item}
          resizeMode={resizeMode}
        />
        {borderEnabled && (
          <InnerBorder
            opacity={0.04}
            radius={UniqueTokenCardBorderRadius}
            width={0.5}
          />
        )}
        <Highlight
          backgroundColor={colors.alpha(colors.white, 0.33)}
          visible={highlight}
        />
      </View>
    </ButtonPressAnimation>
  );
};

UniqueTokenCard.propTypes = {
  borderEnabled: PropTypes.bool,
  disabled: PropTypes.bool,
  height: PropTypes.number,
  highlight: PropTypes.bool,
  item: PropTypes.shape({
    background: PropTypes.string,
    image_preview_url: PropTypes.string,
  }),
  onPress: PropTypes.func,
  resizeMode: UniqueTokenImage.propTypes.resizeMode,
  shadowStyle: stylePropType,
  size: PropTypes.number,
  style: stylePropType,
  width: PropTypes.number,
};

UniqueTokenCard.defaultProps = {
  borderEnabled: true,
};

export default compose(
  withFabSendAction,
  withHandlers({
    onPress: ({ item, onPress }) => () => {
      if (onPress) {
        onPress(item);
      }
    },
  }),
  withProps(({ item: { uniqueId } }) => ({ uniqueId })),
  onlyUpdateForKeys(['height', 'highlight', 'style', 'uniqueId', 'width'])
)(UniqueTokenCard);
