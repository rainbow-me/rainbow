import PropTypes from 'prop-types';
import React from 'react';
import { BaseButton } from 'react-native-gesture-handler';
import { View } from 'react-primitives';
import {
  animated,
  config as ReactSpringConfig,
  interpolate,
  Spring,
} from 'react-spring/dist/native';
import stylePropType from 'react-style-proptype';
import { compose, withHandlers, withState } from 'recompact';
import { animations } from '../../styles';

const AnimatedView = animated(View);

const PressRetentionOffsetValue = 15;
const PressRetentionOffset = {
  bottom: PressRetentionOffsetValue,
  left: PressRetentionOffsetValue,
  right: PressRetentionOffsetValue,
  top: PressRetentionOffsetValue,
};

const interpolateTransform = ({ scale, translateY, ...rest }) => ({
  transform: [
    { scale: interpolate([scale], s => s) },
    { translateY: interpolate([translateY], y => y) },
  ],
});

const ButtonPressAnimation = ({
  activeOpacity,
  animation,
  children,
  config,
  disabled,
  isActive,
  onActiveStateChange,
  onPress,
  onRest,
  style,
}) => (
  <BaseButton
    activeOpacity={activeOpacity}
    disabled={disabled}
    onActiveStateChange={onActiveStateChange}
    onPress={onPress}
    pressRetentionOffset={PressRetentionOffset}
    style={style}
  >
    <Spring
      config={config}
      from={animation.from}
      onRest={onRest}
      native
      to={isActive ? animation.to : animation.from}
    >
      {springValues => (
        <AnimatedView style={interpolateTransform(springValues)}>
          {children}
        </AnimatedView>
      )}
    </Spring>
  </BaseButton>
);

ButtonPressAnimation.propTypes = {
  activeOpacity: PropTypes.number,
  animation: PropTypes.shape({
    from: PropTypes.object.isRequired,
    to: PropTypes.object.isRequired,
  }),
  children: PropTypes.node,
  config: PropTypes.object,
  disabled: PropTypes.bool,
  isActive: PropTypes.bool,
  onActiveStateChange: PropTypes.func,
  onPress: PropTypes.func,
  onRest: PropTypes.func,
  style: stylePropType,
};

ButtonPressAnimation.defaultProps = {
  activeOpacity: 1,
  animation: animations.keyframes.button,
  config: ReactSpringConfig.wobbly, // animations.spring.default,
};

export default compose(
  withState('isActive', 'setIsActive', false),
  withState('didPress', 'setDidPress', false),
  withHandlers({
    onActiveStateChange: ({ onActiveStateChange, setIsActive }) => (isActive) => {
      if (onActiveStateChange) onActiveStateChange(isActive);
      setIsActive(isActive);
    },
    onPress: ({ onPress, setDidPress }) => (event) => {
      if (onPress) onPress(event);
      setDidPress(true);
    },
    onRest: ({ didPress, onRest, setDidPress }) => (event) => {
      if (didPress) setDidPress(false);
      if (onRest) onRest(event);
    },
  }),
)(ButtonPressAnimation);
