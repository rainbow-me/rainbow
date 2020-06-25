import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Animated, {
  Clock,
  spring,
  SpringUtils,
  Value,
} from 'react-native-reanimated';
import { interpolate } from './procs';

const { add, block, clockRunning, cond, multiply, set, startClock } = Animated;

function runTiming(clock, value, dest, friction, tension) {
  const state = {
    finished: new Value(1),
    position: new Value(value),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
    ...SpringUtils.makeDefaultConfig(),
    friction,
    tension,
  });

  const reset = [
    set(state.finished, 0),
    set(state.time, 0),
    set(state.velocity, 0),
  ];

  return block([
    cond(state.finished, [...reset, set(config.toValue, dest)]),
    cond(clockRunning(clock), 0, startClock(clock)),
    spring(clock, state, config),
    state.position,
  ]);
}

export default class SizeToggler extends Component {
  static propTypes = {
    animationNode: PropTypes.any,
    children: PropTypes.any,
    endingWidth: PropTypes.number,
    friction: PropTypes.number,
    startingWidth: PropTypes.number,
    tension: PropTypes.number,
    toggle: PropTypes.bool,
  };

  static defaultProps = {
    friction: 20,
    tension: 200,
  };

  componentWillMount() {
    const { endingWidth, startingWidth, toggle } = this.props;

    if (!toggle === true) {
      this._height = new Value(startingWidth);
    } else {
      this._height = new Value(endingWidth);
    }
  }

  componentWillUpdate(prevProps) {
    const {
      animationNode,
      endingWidth,
      friction,
      startingWidth,
      tension,
      toggle,
    } = this.props;

    if (
      prevProps.toggle !== undefined &&
      prevProps.toggle !== toggle &&
      !animationNode
    ) {
      const clock = new Clock();
      const base = runTiming(
        clock,
        toggle ? -1 : 1,
        toggle ? 1 : -1,
        friction,
        tension
      );
      this._height = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [endingWidth, startingWidth],
      });
    }
  }

  render() {
    const { animationNode, children, endingWidth, startingWidth } = this.props;

    const height = animationNode
      ? add(multiply(animationNode, endingWidth - startingWidth), startingWidth)
      : this._height;

    return <Animated.View style={{ height }}>{children}</Animated.View>;
  }
}
