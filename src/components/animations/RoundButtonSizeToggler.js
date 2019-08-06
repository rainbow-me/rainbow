import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import { View } from 'react-native';
import { colors } from '../../styles';

const {
  add,
  block,
  Clock,
  clockRunning,
  cond,
  divide,
  interpolate,
  multiply,
  set,
  startClock,
  spring,
  sub,
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

export default class RoundButtonSizeToggler extends React.Component {
  componentWillMount() {
    this._width = new Value(this.props.startingWidth);
  }

  componentWillUpdate(prev) {
    if (prev.toggle !== undefined && prev.toggle !== this.props.toggle && !this.props.animationNode) {
      const clock = new Clock();
      const base = runTiming(clock, this.props.toggle ? -1 : 1, this.props.toggle ? 1 : -1, this.props.friction, this.props.tension);
      this._width = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [1, 0],
      });
    }
  }

  render() {
    return (
      <View style={{
        flexDirection: 'row',
        position: this.props.isAbsolute ? 'absolute' : 'relative',
      }}>
        <View style={{
          backgroundColor: colors.lightBlueGrey,
          borderBottomLeftRadius: 15,
          borderTopLeftRadius: 15,
          height: 30,
          width: 30,
        }} />
        <View style={{
          transform: [
            { translateX: -60 },
          ],
        }}>
          <Animated.View
            style={{
              backgroundColor: colors.lightBlueGrey,
              transform: [
                { scaleX: this.props.animationNode ? add(multiply(this.props.animationNode, (this.props.endingWidth / 100 - this.props.startingWidth / 100)), this.props.startingWidth / 100) : this.props.startingWidth / 100 },
                { translateX: this.props.animationNode ? multiply(divide(sub(1, add(multiply(this.props.animationNode, (this.props.endingWidth / 100 - this.props.startingWidth / 100), this.props.startingWidth / 100), 100)), 2), -1) : this.props.startingWidth },
              ],
              width: 100,
            }}
          >
            {this.props.children}
          </Animated.View>
        </View>
        <Animated.View style={{
          backgroundColor: colors.lightBlueGrey,
          borderBottomRightRadius: 15,
          borderTopRightRadius: 15,
          height: 30,
          marginLeft: -11,
          transform: [
            { translateX: this.props.animationNode ? multiply(-100, sub(1, add(multiply(this.props.animationNode, (this.props.endingWidth / 100 - this.props.startingWidth / 100)), this.props.startingWidth / 100))) : -1 * (95 - (this.props.startingWidth / 100)) },
          ],
          width: 30,
        }} />
      </View>
    );
  }
}

RoundButtonSizeToggler.propTypes = {
  animationNode: PropTypes.any,
  children: PropTypes.any,
  endingWidth: PropTypes.number,
  friction: PropTypes.number,
  isAbsolute: PropTypes.bool,
  startingWidth: PropTypes.number,
  tension: PropTypes.number,
  toggle: PropTypes.bool,
};

RoundButtonSizeToggler.defaultProps = {
  friction: 20,
  tension: 200,
};
