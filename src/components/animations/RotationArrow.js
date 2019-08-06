import PropTypes from 'prop-types';
import React from 'react';
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
  sub,
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

class RotationArrow extends React.Component {
  componentWillUpdate(prev) {
    if (prev.isOpen !== undefined
        && prev.isOpen !== this.props.isOpen) {
      const clock = new Clock();
      const base = runTiming(clock, this.props.isOpen ? -1 : 1, this.props.isOpen ? 1 : -1, this.props.friction, this.props.tension);
      this._transform = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: this.props.reversed ? [1, 0] : [0, 1],
      });
    }
  }

  render() {
    return (
      <Animated.View
        style={{
          transform:
          [{
            translateX: this.props.endingOffset ? this._transform ? this.props.reversed ? multiply(this._transform, this.props.endingOffset) : sub(this.props.endingOffset, multiply(this._transform, this.props.endingOffset)) : this.props.reversed ? 0 : this.props.endingOffset : 0,
          }],
        }}
      >
        <Animated.View
          style={{
            transform:
            [{
              // eslint-disable-next-line no-nested-ternary
              rotate: this._transform
                ? (this.props.reversed ? concat(multiply(this._transform, this.props.endingPosition), 'deg') : concat(sub(this.props.endingPosition, multiply(this._transform, this.props.endingPosition)), 'deg'))
                : (this.props.reversed ? 0 : `${this.props.endingPosition}deg`),
            }],
          }}
        >
          {this.props.children}
        </Animated.View>
      </Animated.View>
    );
  }
}

RotationArrow.propTypes = {
  children: PropTypes.any,
  endingOffset: PropTypes.number,
  endingPosition: PropTypes.number,
  friction: PropTypes.number,
  isOpen: PropTypes.bool,
  reversed: PropTypes.bool,
  tension: PropTypes.number,
};

RotationArrow.defaultProps = {
  friction: 20,
  tension: 200,
};

export default RotationArrow;
