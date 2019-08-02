import PropTypes from 'prop-types';
import React from 'react';
import Animated, { Easing } from 'react-native-reanimated';

const {
  block,
  Clock,
  clockRunning,
  concat,
  cond,
  interpolate,
  set,
  startClock,
  spring,
  Value,
  SpringUtils,
} = Animated;

function runTiming(clock, value, dest, isOpen) {
  const state = {
    finished: new Value(1),
    position: new Value(value),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = Animated.SpringUtils.makeConfigFromOrigamiTensionAndFriction({
    ...SpringUtils.makeDefaultConfig(),
    friction: 20,
    tension: 200,
  });

  const reset = [
    set(state.finished, 0),
    set(state.time, 0),
    set(state.velocity, 0),
  ];

  return block([
    cond(state.finished, [
      ...reset,
      set(config.toValue, dest),
    ]),
    cond(clockRunning(clock), 0, startClock(clock)),
    spring(clock, state, config),
    state.position,
  ]);
}

class RotationArrow extends React.Component {
  componentWillUpdate(prev) {
    if (prev.isOpen !== undefined
        && prev.isOpen !== this.props.isOpen) {
      const clock = new Clock();
      const base = this.props.isOpen ? runTiming(clock, -1, 1, this.props.isOpen) : runTiming(clock, 1, -1, this.props.isOpen);
      this._rotation = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [this.props.endingPosition, this.props.startingPosition],
      });
    }
  }

  render() {
    return (
      <Animated.View
        style={{ transform: [{ rotate: this._rotation ? concat(this._rotation, 'deg') : `${this.props.startingPosition}deg` }] }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

RotationArrow.propTypes = {
  children: PropTypes.any,
  endingPosition: PropTypes.number,
  isOpen: PropTypes.bool,
  startingPosition: PropTypes.number,
};

export default RotationArrow;
