import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Animated, Easing } from 'react-native';

export default class SpinAnimation extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    duration: PropTypes.number,
  }

  static defaultProps = {
    duration: 2000,
  }

  animatedValue = new Animated.Value(0)

  componentDidMount = () => (
    Animated.loop(
      Animated.timing(this.animatedValue, {
        duration: this.props.duration,
        easing: Easing.linear,
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      }),
    ).start()
  )

  componentWillUnmount = () => this.animatedValue.stopAnimation()

  interpolatedAnimation = () => (
    this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    })
  )

  render = () => (
    <Animated.View style={{ transform: [{ rotate: this.interpolatedAnimation() }] }}>
      {this.props.children}
    </Animated.View>
  )
}
