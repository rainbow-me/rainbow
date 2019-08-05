import PropTypes from 'prop-types';
import React from 'react';
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

export default class SizeToggler extends React.Component {
  componentWillMount() {
    this._height = new Value(this.props.startingWidth);
  }

  componentWillUpdate(prev) {
    if (prev.toggle !== undefined && prev.toggle !== this.props.toggle && !this.props.animationNode) {
      const clock = new Clock();
      const base = this.props.toggle ? runTiming(clock, -1, 1) : runTiming(clock, 1, -1);
      this._height = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [this.props.endingWidth, this.props.startingWidth],
      });
    }
  }

  render() {
    return (
      <Animated.View
        style={{ height: this.props.animationNode ? add(multiply(this.props.animationNode, (this.props.endingWidth - this.props.startingWidth)), this.props.startingWidth) : this._height }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

SizeToggler.propTypes = {
  animationNode: PropTypes.any,
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
