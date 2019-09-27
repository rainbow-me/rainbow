import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Animated from 'react-native-reanimated';

const {
  add,
  block,
  Clock,
  clockRunning,
  cond,
  interpolate,
  multiply,
  set,
  spring,
  SpringUtils,
  startClock,
  Value,
} = Animated;

function runTiming(clock, value, dest, friction, tension) {
  const state = {
    finished: new Value(1),
    position: new Value(value),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = Animated.SpringUtils.makeConfigFromOrigamiTensionAndFriction({
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

export default class OpacityToggler extends Component {
  static propTypes = {
    animationNode: PropTypes.any,
    children: PropTypes.any,
    endingOpacity: PropTypes.number,
    friction: PropTypes.number,
    isVisible: PropTypes.bool,
    startingOpacity: PropTypes.number,
    tension: PropTypes.number,
  };

  static defaultProps = {
    endingOpacity: 0,
    friction: 20,
    startingOpacity: 1,
    tension: 200,
  };

  componentWillMount() {
    if (!this.props.animationNode) {
      this._isVisible = this.props.isVisible;
    }
  }

  componentWillUpdate(prevProps) {
    const {
      animationNode,
      endingOpacity,
      friction,
      isVisible,
      startingOpacity,
      tension,
    } = this.props;

    if (
      prevProps.isVisible !== undefined &&
      prevProps.isVisible !== isVisible &&
      !animationNode
    ) {
      const clock = new Clock();
      const base = runTiming(
        clock,
        isVisible ? -1 : 1,
        isVisible ? 1 : -1,
        friction,
        tension
      );
      this._opacity = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [endingOpacity, startingOpacity],
      });
    }
  }

  render() {
    const {
      animationNode,
      children,
      endingOpacity,
      startingOpacity,
    } = this.props;

    let opacity = !this._isVisible ? startingOpacity : endingOpacity;

    if (animationNode) {
      opacity =
        startingOpacity === 0
          ? animationNode
          : multiply(add(animationNode, -1), -1);
    } else if (this._opacity) {
      opacity = this._opacity;
    }

    return <Animated.View style={{ opacity }}>{children}</Animated.View>;
  }
}
