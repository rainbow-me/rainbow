import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Animated, {
  Clock,
  spring,
  SpringUtils,
  Value,
} from 'react-native-reanimated';
import { interpolate } from './procs';

const {
  block,
  clockRunning,
  concat,
  cond,
  multiply,
  set,
  startClock,
  sub,
} = Animated;

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

export default class RotationArrow extends Component {
  static propTypes = {
    children: PropTypes.any,
    endingOffset: PropTypes.number,
    endingPosition: PropTypes.number,
    friction: PropTypes.number,
    isOpen: PropTypes.bool,
    tension: PropTypes.number,
  };

  static defaultProps = {
    friction: 20,
    tension: 200,
  };

  _transform: any;

  UNSAFE_componentWillMount() {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isOpen' does not exist on type 'Readonly... Remove this comment to see the full error message
    if (!this.props.isOpen === true) {
      this._transform = new Value(1);
    } else {
      this._transform = new Value(0);
    }
  }

  UNSAFE_componentWillUpdate(prevProps: any) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'friction' does not exist on type 'Readon... Remove this comment to see the full error message
    const { friction, isOpen, tension } = this.props;

    if (prevProps.isOpen !== undefined && prevProps.isOpen !== isOpen) {
      const clock = new Clock();
      const base = runTiming(
        clock,
        isOpen ? -1 : 1,
        isOpen ? 1 : -1,
        friction,
        tension
      );
      this._transform = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [0, 1],
      });
    }
  }

  render() {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'endingOffset' does not exist on type 'Re... Remove this comment to see the full error message
    const { children, endingOffset, endingPosition } = this.props;

    let translateX = 0;
    if (endingOffset) {
      translateX = this._transform
        ? sub(endingOffset, multiply(this._transform, endingOffset))
        : endingOffset;
    }

    let rotate = `${endingPosition}deg`;
    if (this._transform) {
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'AnimatedNode<string>' is not assignable to t... Remove this comment to see the full error message
      rotate = concat(
        sub(endingPosition, multiply(this._transform, endingPosition)),
        'deg'
      );
    }

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Animated.View style={{ transform: [{ translateX }] }}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Animated.View style={{ transform: [{ rotate }] }}>
          {children}
        </Animated.View>
      </Animated.View>
    );
  }
}
