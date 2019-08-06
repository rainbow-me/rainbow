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
    cond(state.finished, [
      ...reset,
      set(config.toValue, dest),
    ]),
    cond(clockRunning(clock), 0, startClock(clock)),
    spring(clock, state, config),
    state.position,
  ]);
}

export default class OpacityToggler extends React.Component {
  componentWillUpdate(prev) {
    if (prev.isVisible !== undefined && prev.isVisible !== this.props.isVisible && !this.props.animationNode) {
      const clock = new Clock();
      const base = runTiming(clock, this.props.isVisible ? -1 : 1, this.props.isVisible ? 1 : -1, this.props.friction, this.props.tension);
      this._opacity = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [this.props.endingOpacity, this.props.startingOpacity],
      });
    }
  }

  render() {
    return (
      <Animated.View
        style={{ opacity: this.props.animationNode ? (this.props.startingOpacity === 0 ? this.props.animationNode : (multiply(add(this.props.animationNode, -1), -1))) : (this._opacity ? this._opacity : this.props.startingOpacity) }}
      >
        {this.props.children}
      </Animated.View>
    );
  }
}

OpacityToggler.propTypes = {
  animationNode: PropTypes.any,
  children: PropTypes.any,
  endingOpacity: PropTypes.number,
  friction: PropTypes.number,
  isVisible: PropTypes.bool,
  startingOpacity: PropTypes.number,
  tension: PropTypes.number,
};

OpacityToggler.defaultProps = {
  endingOpacity: 0,
  friction: 20,
  startingOpacity: 1,
  tension: 200,
};
