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
  multiply,
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
      this._transform = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: this.props.reversed ? [1, 0] : [0, 1],
      });
    }
  }

  render() {
    return (
      <Animated.View
        style={{ transform: 
          [{
            rotate: this._transform ? concat(multiply(this._transform, this.props.endingPosition), 'deg') : this.props.reversed ? 0 : `${this.props.endingPosition}deg`,
            translateY: this._transform ? multiply(this._transform, this.props.endingOffset) : 0,
          }],
        }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

RotationArrow.propTypes = {
  children: PropTypes.any,
  endingOffset: PropTypes.number,
  endingPosition: PropTypes.number,
  isOpen: PropTypes.bool,
  reversed: PropTypes.bool,
};

export default RotationArrow;
