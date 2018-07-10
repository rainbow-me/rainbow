import omitProps from '@hocs/omit-props';
import PropTypes from 'prop-types';
import React from 'react';
import { TouchableWithoutFeedback } from 'react-native';
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
  children,
  isPressed,
  onPressIn,
  onPressOut,
}) => (
  <TouchableWithoutFeedback
    onPressIn={onPressIn}
    onPressOut={onPressOut}
  >
    {/* TouchableWithoutFeedback requires its children to be wrapped in a <View /> */}
    <View>
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
    </View>
  </TouchableWithoutFeedback>
);

ButtonPressAnimation.propTypes = {
  children: PropTypes.node,
  isPressed: PropTypes.bool,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
};

export default compose(
  withState('isPressed', 'toggleIsPressed', false),
  withHandlers({
    onPressIn: ({ toggleIsPressed }) => () => toggleIsPressed(true),
    onPressOut: ({ toggleIsPressed }) => () => toggleIsPressed(false),
  }),
  omitProps('toggleIsPressed'),
)(ButtonPressAnimation);
