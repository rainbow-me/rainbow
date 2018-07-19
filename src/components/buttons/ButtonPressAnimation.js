import omitProps from '@hocs/omit-props';
import PropTypes from 'prop-types';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { View } from 'react-primitives';
import { animated, interpolate, Spring } from 'react-spring/dist/native';
import { compose, withHandlers, withState } from 'recompose';

const AnimatedView = animated(View);

const PressAnimationState = {
  from: { scale: 1, translateY: 0 },
  to: { scale: 0.90, translateY: 1 },
};

const buildAnimatedTransform = ({ scale, translateY }) => ({
  transform: [
    { scale: interpolate([scale], s => s) },
    { translateY: interpolate([translateY], y => y) },
  ],
});

const ButtonPressAnimation = ({
  activeOpacity,
  children,
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
      from={PressAnimationState.from}
      native
      to={isPressed ? PressAnimationState.to : PressAnimationState.from}
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
  children: PropTypes.node,
  disabled: PropTypes.bool,
  isPressed: PropTypes.bool,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
};

ButtonPressAnimation.defaultProps = {
  activeOpacity: 1,
};

export default compose(
  withState('isPressed', 'toggleIsPressed', false),
  withHandlers({
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
