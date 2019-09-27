import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Animated from 'react-native-reanimated';
import { View } from 'react-primitives';
import styled from 'styled-components/primitives';
import { borders, colors, position } from '../../styles';

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
  spring,
  SpringUtils,
  startClock,
  sub,
  Value,
} = Animated;

const RoundButtonCapSize = 30;
const RoundButtonCap = styled(Animated.View)`
  ${({ capDirection }) =>
    borders.buildRadius(capDirection, RoundButtonCapSize / 2)};
  ${position.size(RoundButtonCapSize)};
  background-color: ${({ color }) => color};
`;

function runTiming(clock, value, dest, friction, tension) {
  const state = {
    finished: new Value(1),
    position: new Value(value),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
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

export default class RoundButtonSizeToggler extends PureComponent {
  static propTypes = {
    animationNode: PropTypes.any,
    color: PropTypes.string,
    endingWidth: PropTypes.number,
    friction: PropTypes.number,
    isAbsolute: PropTypes.bool,
    reversed: PropTypes.bool,
    startingWidth: PropTypes.number,
    tension: PropTypes.number,
    toggle: PropTypes.bool,
  };

  static defaultProps = {
    color: colors.lightBlueGrey,
    friction: 20,
    tension: 200,
  };

  static capSize = RoundButtonCapSize;

  componentWillMount() {
    this._width = new Value(this.props.startingWidth);
  }

  componentWillUpdate(prevProps) {
    const { animationNode, friction, tension, toggle } = this.props;

    if (
      !isNil(prevProps.toggle) &&
      prevProps.toggle !== toggle &&
      !animationNode
    ) {
      const clock = new Clock();
      const base = runTiming(
        clock,
        toggle ? -1 : 1,
        toggle ? 1 : -1,
        friction,
        tension
      );
      this._width = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [1, 0],
      });
    }
  }

  render() {
    const {
      animationNode,
      color,
      endingWidth,
      isAbsolute,
      reversed,
      startingWidth,
    } = this.props;

    let contentScaleX =
      (startingWidth + (reversed ? 0 : endingWidth + 5)) / 100;
    if (animationNode) {
      contentScaleX = add(
        multiply(animationNode, endingWidth / 100 - startingWidth / 100),
        startingWidth / 100
      );
    }

    let contentTranslateX = reversed ? startingWidth : endingWidth;
    if (animationNode) {
      contentTranslateX = multiply(divide(sub(1, contentScaleX, 100), 2), -1);
    }

    let rightCapTranslateX =
      -1 * (100 - (reversed ? startingWidth : endingWidth)) - 11;
    if (animationNode) {
      rightCapTranslateX = sub(multiply(-100, sub(1, contentScaleX)), 11);
    }

    return (
      <View flexDirection="row" position={isAbsolute ? 'absolute' : 'relative'}>
        <RoundButtonCap capDirection="left" color={color} />
        <View style={{ transform: [{ translateX: RoundButtonCapSize * -2 }] }}>
          <Animated.View
            style={{
              backgroundColor: color,
              height: RoundButtonCapSize,
              transform: [
                { scaleX: contentScaleX },
                { translateX: contentTranslateX },
              ],
              width: 100,
            }}
          />
        </View>
        <RoundButtonCap
          capDirection="right"
          color={color}
          style={{ transform: [{ translateX: rightCapTranslateX }] }}
        />
      </View>
    );
  }
}
