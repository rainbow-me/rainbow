import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { View } from 'react-primitives';
import { animated, interpolate, Spring } from 'react-spring/dist/native';
import { compose, omitProps, withHandlers, withState } from 'recompact';
import { animations } from '../../styles';

const AnimatedView = animated(View);

const buildAnimatedTransform = ({ scale, translateY }) => ({
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
  isPressed,
  onPress,
  onPressIn,
  onPressOut,
}) => (
  <TouchableOpacity
    activeOpacity={activeOpacity}
    disabled={disabled}
    onPress={onPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
  >
    <Spring
      config={config}
      from={animation.from}
      native
      to={isPressed ? animation.to : animation.from}
    >
      {springValues => (
        <AnimatedView style={buildAnimatedTransform(springValues)}>
          {children}
        </AnimatedView>
      )}
    </Spring>
  </TouchableOpacity>
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
  isPressed: PropTypes.bool,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
};

ButtonPressAnimation.defaultProps = {
  activeOpacity: 1,
  animation: animations.keyframes.button,
  // config: animations.spring.default,
};

export default compose(
  withState('isPressed', 'toggleIsPressed', false),
  withHandlers({
    onPress: ({ onPress, toggleIsPressed }) => (event) => {
      toggleIsPressed(false);
      if (onPress) {
        onPress(event);
      }
    },
    onPressIn: ({ onPressIn, toggleIsPressed }) => (event) => {
      toggleIsPressed(true);
      if (onPressIn) {
        onPressIn(event);
      }
    },
    onPressOut: ({ onPressOut, toggleIsPressed }) => (event) => {
      toggleIsPressed(false);
      if (onPressOut) {
        onPressOut(event);
      }
    },
  }),
  omitProps('toggleIsPressed'),
)(ButtonPressAnimation);
