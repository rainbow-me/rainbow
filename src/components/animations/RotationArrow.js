import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Animated from 'react-native-reanimated';

const {
  block,
  Clock,
  clockRunning,
  concat,
  cond,
  interpolate,
  multiply,
  set,
  spring,
  SpringUtils,
  startClock,
  sub,
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
    cond(state.finished, [
      ...reset,
      set(config.toValue, dest),
    ]),
    cond(clockRunning(clock), 0, startClock(clock)),
    spring(clock, state, config),
    state.position,
  ]);
}

export default class RotationArrow extends Component {
  static propTypes = {
    children: PropTypes.any,
    endingOffset: PropTypes.number,
    endingPosition: PropTypes.number,
    friction: PropTypes.number,
    isOpen: PropTypes.bool,
    reversed: PropTypes.bool,
    tension: PropTypes.number,
  }

  static defaultProps = {
    friction: 20,
    tension: 200,
  }

  componentWillMount() {
    if (!this.props.isOpen === true) {
      this._transform = new Value(1);
    } else {
      this._transform = new Value(0);
    }
  }

  componentWillUpdate(prevProps) {
    const { friction, isOpen, tension } = this.props;

    if (prevProps.isOpen !== undefined && prevProps.isOpen !== isOpen) {
      const clock = new Clock();
      const base = runTiming(clock, isOpen ? -1 : 1, isOpen ? 1 : -1, friction, tension);
      this._transform = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [0, 1],
      });
    }
  }

  render() {
    const {
      children,
      endingOffset,
      endingPosition,
    } = this.props;

    let translateX = 0;
    if (endingOffset) {
      translateX = this._transform
        ? sub(endingOffset, multiply(this._transform, endingOffset))
        : endingOffset;
    }

    let rotate = `${endingPosition}deg`;
    if (this._transform) {
      rotate = concat(sub(endingPosition, multiply(this._transform, endingPosition)), 'deg');
    }

    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          {children}
        </Animated.View>
      </Animated.View>
    );
  }
}
