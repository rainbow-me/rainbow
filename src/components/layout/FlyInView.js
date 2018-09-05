import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Animated } from 'react-native';

import Flex from './Flex';

export default class FlyInView extends Component {
  static propTypes = {
    children: PropTypes.any,
    style: PropTypes.object,
  };

  static defaultProps = {
    children: [],
    style: {},
  };

  state = {
    animation: new Animated.Value(0),
  };

  componentDidMount() {
    const { animation } = this.state;

    Animated.timing(animation, { toValue: 1, duration: 300 }).start();
  }

  componentWillUnmount() {
    const { animation } = this.state;

    Animated.timing(animation, { toValue: 0, duration: 300 }).start();
  }

  render() {
    const { children, style } = this.props;
    const { animation } = this.state;

    return (
      <Flex style={{
        ...style,
        marginTop: animation.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }),
        opacity: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
      }}>
        {children}
      </Flex>
    );
  }
}
