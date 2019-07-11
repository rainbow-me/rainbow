import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Animated, { Easing } from 'react-native-reanimated';

const buildAnimation = (value, toValue) => (
  Animated.timing(value, {
    duration: 175,
    easing: Easing.bezier(0.165, 0.84, 0.44, 1),
    isInteraction: false,
    toValue,
    useNativeDriver: true,
  }).start()
);

export default class FlyInAnimation extends PureComponent {
  static propTypes = {
    children: PropTypes.any,
    style: PropTypes.object,
  };

  animation = new Animated.Value(0)

  componentDidMount = () => buildAnimation(this.animation, 1)

  componentWillUnmount = () => buildAnimation(this.animation, 0)

  buildInterpolation = outputRange => (
    Animated.interpolate(this.animation, {
      inputRange: [0, 1],
      outputRange,
    })
  )

  render = () => (
    <Animated.View
      style={{
        ...this.props.style,
        opacity: this.buildInterpolation([0, 1]),
        transform: [{ translateY: this.buildInterpolation([30, 0]) }],
      }}
    >
      {this.props.children}
    </Animated.View>
  )
}
