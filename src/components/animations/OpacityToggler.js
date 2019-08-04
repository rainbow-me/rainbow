import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';

const {
  block,
  Clock,
  clockRunning,
  cond,
  interpolate,
  set,
  startClock,
  spring,
  Value,
  SpringUtils,
} = Animated;

function runTiming(clock, value, dest) {
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

export class OpacityToggler extends React.Component {
  componentWillUpdate(prev) {
    if (prev.isVisible !== undefined
        && prev.isVisible !== this.props.isVisible) {
      const clock = new Clock();
      const base = this.props.isVisible ? runTiming(clock, -1, 1) : runTiming(clock, 1, -1);
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

export class SizeToggler extends React.Component {
  componentWillMount() {
    this._width = new Value(this.props.startingWidth);
  }

  componentWillUpdate(prev) {
    if (prev.toggle !== undefined
        && prev.toggle !== this.props.toggle) {
      const clock = new Clock();
      const base = this.props.toggle ? runTiming(clock, -1, 1) : runTiming(clock, 1, -1);
      this._width = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [this.props.endingWidth, this.props.startingWidth],
      });
    }
  }

  render() {
    console.log(this._width);
    return (
      <Animated.View
        style={{ width: this._width }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

SizeToggler.propTypes = {
  children: PropTypes.any,
  duration: PropTypes.number,
  endingWidth: PropTypes.number,
  startingWidth: PropTypes.number,
  toggle: PropTypes.bool,
};

SizeToggler.defaultProps = {
  duration: 200,
  endingOpacity: 0,
  startingOpacity: 1,
};
