import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Animated, Easing } from 'react-native';
import stylePropType from 'react-style-proptype';

export default class SpinAnimation extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    duration: PropTypes.number,
    style: stylePropType,
  };

  static defaultProps = {
    duration: 2000,
  };

  componentDidMount = () =>
    Animated.loop(
      Animated.timing(this.animatedValue, {
        duration: this.props.duration,
        easing: Easing.linear,
        isInteraction: false,
        toValue: 1,
        useNativeDriver: true,
      })
    ).start();

  componentWillUnmount = () => this.animatedValue.stopAnimation();

  animatedValue = new Animated.Value(0);

  interpolatedAnimation = () =>
    this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

  render = () => {
    const { children, style } = this.props;

    return (
      <Animated.View
        style={[
          style,
          { transform: [{ rotate: this.interpolatedAnimation() }] },
        ]}
      >
        {children}
      </Animated.View>
    );
  };
}
