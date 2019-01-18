import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Animated, Easing } from 'react-native';

export default class FadeInAnimation extends PureComponent {
  static propTypes = {
    children: PropTypes.node,
    duration: PropTypes.number,
    easing: PropTypes.func,
    from: PropTypes.number,
    style: PropTypes.object,
    to: PropTypes.number,
  }

  static defaultProps = {
    duration: 250,
    easing: Easing.quad,
    from: 0,
    to: 1,
  }

  animatedOpacity = new Animated.Value(0)

  componentDidMount = () => {
    const { duration, easing, to } = this.props;

    Animated.timing(this.animatedOpacity, {
      duration,
      easing,
      isInteraction: false,
      toValue: to,
      useNativeDriver: true,
    }).start();
  }

  componentWillUnmount = () => this.animatedOpacity.stopAnimation()

  interpolatedAnimation = () => {
    const { from, to } = this.props;

    return this.animatedOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: [from, to],
    });
  }

  render = () => (
    <Animated.View
      {...this.props}
      style={[
        this.props.style,
        { opacity: this.interpolatedAnimation() },
      ]}
    />
  )
}
