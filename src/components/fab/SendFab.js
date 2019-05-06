import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';
import {
  compose,
  onlyUpdateForKeys,
  pure,
  withHandlers,
} from 'recompact';
import Icon from '../icons/Icon';
import FloatingActionButton from './FloatingActionButton';

const {
  set,
  cond,
  eq,
  or,
  add,
  sub,
  pow,
  min,
  max,
  debug,
  multiply,
  divide,
  lessThan,
  spring,
  defined,
  decay,
  timing,
  call,
  diff,
  acc,
  not,
  abs,
  onChange,
  block,
  startClock,
  stopClock,
  clockRunning,
  Value,
  Clock,
  event,
} = Animated;

function runSpring(clock, value, velocity, dest, wasRunSpring) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = {
    damping: 30,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: 121.6,
    toValue: new Value(0),
  };

  return [
    cond(or(wasRunSpring, clockRunning(clock)), 0, [
      set(state.finished, 0),
      set(state.velocity, velocity),
      set(state.position, value),
      set(config.toValue, dest),
      startClock(clock),
    ]),
    spring(clock, state, config),
    cond(state.finished, [
      stopClock(clock),
      set(wasRunSpring, 1),
    ]),
    state.position,
  ];
}


class Movable extends React.Component {
  static defaultProps = {
    touchableAreas: [
      {
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        onEnter: () => {},
        onLeave: () => {},
        onDrop: () => {},
      },
    ],
    scrollOffset: new Animated.Value(0),
  }

  dragX = new Animated.Value(0)

  dragY = new Animated.Value(0)

  dragVX = new Animated.Value(0)

  dragVY = new Animated.Value(0)

  gestureState = new Animated.Value(0)

  springOffsetX = new Animated.Value(0)

  springOffsetY = new Animated.Value(0)

  clockX = new Clock()

  clockY = new Clock()

  wasRunSpring = new Animated.Value()

  onGestureEvent = event([
    {
      nativeEvent: {
        translationX: this.dragX,
        velocityX: this.dragVX,
        velocityY: this.dragVY,
        state: this.gestureState,
        translationY: this.dragY,
      },
    },
  ])

  onHandlerStateChange = event([
    {
      nativeEvent: {
        state: this.gestureState,
      },
    },
  ])

  render() {
    console.log(this.props.sections)
    return (
      <PanGestureHandler
        onGestureEvent={this.onGestureEvent}
        onHandlerStateChange={this.onHandlerStateChange}
      >
        <Animated.View
          style={{
            transform: [
              {
                translateY: add(this.dragY, this.springOffsetY),
              },
              {
                translateX: add(this.dragX, this.springOffsetX),
              },
            ],
          }}
        >
          <Animated.Code
            exec={
              block([
                call([this.props.scrollViewTracker], console.log),
                onChange(
                  this.gestureState,
                  cond(
                    eq(this.gestureState, State.END),
                    [
                      set(this.springOffsetX, add(this.dragX, this.springOffsetX)),
                      set(this.springOffsetY, add(this.dragY, this.springOffsetY)),
                      set(this.dragX, 0),
                      set(this.dragY, 0),
                    ],
                  ),
                ),
                cond(
                  eq(this.gestureState, State.END),
                  [
                    set(this.springOffsetX, runSpring(this.clockX, this.springOffsetX, this.dragVX, 0, this.wasRunSpring)),
                    set(this.springOffsetY, runSpring(this.clockY, this.springOffsetY, this.dragVY, 0, this.wasRunSpring)),
                  ],
                  [
                    stopClock(this.clockX),
                    stopClock(this.clockY),
                    set(this.wasRunSpring, 0),
                  ],
                ),
              ])
            }
          />
          {this.props.children}
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

const SendFab = ({
  disabled, onPress, scrollViewTracker, sections, ...props
}) => (
  <Movable
    sections={sections}
    scrollViewTracker={scrollViewTracker}
  >
    <FloatingActionButton
      {...props}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon
        name="send"
        style={{
          height: 21,
          marginBottom: 2,
          width: 22,
        }}
      />
    </FloatingActionButton>
  </Movable>
);


SendFab.propTypes = {
  children: PropTypes.any,
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.array,
};

export default compose(
  pure,
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => {
      navigation.navigate('SendSheet');
    },
  }),
  onlyUpdateForKeys(['disabled', 'sections']),
)(SendFab);
