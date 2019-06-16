import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { pure, toClass } from 'recompact';
import { colors, position, shadow as shadowUtil } from '../../styles';

const ShadowItem = pure(({ backgroundColor, shadow, ...props }) => (
  <View
    {...props}
    css={`
      ${position.cover};
      ${shadowUtil.build(...shadow)}
      background-color: ${backgroundColor || colors.white};
    `}
    shouldRasterizeIOS
  />
));

ShadowItem.propTypes = {
  backgroundColor: PropTypes.string,
  height: PropTypes.number,
  shadow: PropTypes.array,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export const AnimatedShadowItem = Animated.createAnimatedComponent(toClass(ShadowItem));
export default ShadowItem;
