import PropTypes from 'prop-types';
import React from 'react';
import Animated, { Easing } from 'react-native-reanimated';

const {
  block,
  Clock,
  clockRunning,
  cond,
  interpolate,
  set,
  startClock,
  timing,
  Value,
} = Animated;

function runTiming(clock, value, dest, duration) {
  const state = {
    finished: new Value(1),
    frameTime: new Value(0),
    position: new Value(value),
    time: new Value(0),
  };

  const config = {
    duration,
    easing: Easing.inOut(Easing.ease),
    toValue: new Value(0),
  };

  const reset = [
    set(state.finished, 0),
    set(state.time, 0),
    set(state.frameTime, 0),
  ];

  return block([
    cond(state.finished, [
      ...reset,
      set(config.toValue, dest),
    ]),
    cond(clockRunning(clock), 0, startClock(clock)),
    timing(clock, state, config),
    state.position,
  ]);
}

class OpacityToggler extends React.Component {
  componentWillUpdate(prev) {
    if (prev.isVisible !== undefined
        && prev.isVisible !== this.props.isVisible) {
      const clock = new Clock();
      const base = this.props.isVisible ? runTiming(clock, -1, 1, this.props.duration) : runTiming(clock, 1, -1, this.props.duration);
      this._opacity = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [this.props.endingOpacity, this.props.startingOpacity],
      });
    }
  }

  render() {
    return (
      <Animated.View
        style={{ opacity: this._opacity ? this._opacity : this.props.startingOpacity }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

OpacityToggler.propTypes = {
  children: PropTypes.any,
  duration: PropTypes.number,
  endingOpacity: PropTypes.number,
  isVisible: PropTypes.bool,
  startingOpacity: PropTypes.number,
};

OpacityToggler.defaultProps = {
  duration: 200,
  endingOpacity: 0,
  startingOpacity: 1,
};

export default OpacityToggler;
