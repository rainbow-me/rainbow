import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Animated, {
  Clock,
  spring,
  SpringUtils,
  Value,
} from 'react-native-reanimated';
import { interpolate } from './procs';

const { add, block, clockRunning, cond, multiply, set, startClock } = Animated;

function runTiming(
  clock: any,
  value: any,
  dest: any,
  friction: any,
  tension: any
) {
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
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<number>' is not assign... Remove this comment to see the full error message
    cond(state.finished, [...reset, set(config.toValue, dest)]),
    cond(clockRunning(clock), 0, startClock(clock)),
    spring(clock, state, config),
    state.position,
  ]);
}

export default class SizeToggler extends Component {
  static propTypes = {
    animationNode: PropTypes.any,
    children: PropTypes.any,
    endingWidth: PropTypes.number,
    friction: PropTypes.number,
    startingWidth: PropTypes.number,
    tension: PropTypes.number,
    toggle: PropTypes.bool,
  };

  static defaultProps = {
    friction: 20,
    tension: 200,
  };

  _height: any;

  UNSAFE_componentWillMount() {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'endingWidth' does not exist on type 'Rea... Remove this comment to see the full error message
    const { endingWidth, startingWidth, toggle } = this.props;

    if (!toggle === true) {
      this._height = new Value(startingWidth);
    } else {
      this._height = new Value(endingWidth);
    }
  }

  UNSAFE_componentWillUpdate(prevProps: any) {
    const {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'animationNode' does not exist on type 'R... Remove this comment to see the full error message
      animationNode,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'endingWidth' does not exist on type 'Rea... Remove this comment to see the full error message
      endingWidth,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'friction' does not exist on type 'Readon... Remove this comment to see the full error message
      friction,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'startingWidth' does not exist on type 'R... Remove this comment to see the full error message
      startingWidth,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'tension' does not exist on type 'Readonl... Remove this comment to see the full error message
      tension,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'toggle' does not exist on type 'Readonly... Remove this comment to see the full error message
      toggle,
    } = this.props;

    if (
      prevProps.toggle !== undefined &&
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
      this._height = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [endingWidth, startingWidth],
      });
    }
  }

  render() {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'animationNode' does not exist on type 'R... Remove this comment to see the full error message
    const { animationNode, children, endingWidth, startingWidth } = this.props;

    const height = animationNode
      ? add(multiply(animationNode, endingWidth - startingWidth), startingWidth)
      : this._height;

    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    return <Animated.View style={{ height }}>{children}</Animated.View>;
  }
}
