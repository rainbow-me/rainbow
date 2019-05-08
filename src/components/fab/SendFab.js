import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import {
  compose,
  onlyUpdateForKeys,
  pure,
  withHandlers, withProps,
} from 'recompact';
import Icon from '../icons/Icon';
import FloatingActionButton from './FloatingActionButton';
import { deviceUtils } from '../../utils';
import { CoinRow } from '../coin-row';
import { ListFooter } from '../list';
import connect from 'react-redux/es/connect/connect';
import { setIsWalletEmpty } from '../../redux/isWalletEmpty';
import { updateSelectedID } from '../../redux/selectedWithFab';

const {
  set,
  cond,
  eq,
  or,
  add,
  and,
  greaterThan,
  lessThan,
  spring,
  call,
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
  static propTypes = {
    areas: PropTypes.array,
    setHighlightedToken: PropTypes.func,
  }

  static defaultProps = {
    scrollOffset: new Animated.Value(0),
  }

  dragX = new Animated.Value(0)

  selectedIndex = new Animated.Value(0)

  absoluteX = new Animated.Value(0)

  absoluteY = new Animated.Value(0)

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
        absoluteX: this.absoluteX,
        absoluteY: this.absoluteY,
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

  calculateSelectedIndex = () => this.props.areas.reduce((prev, curr, i) => cond(
    and(
      greaterThan(this.absoluteX, curr.left),
      greaterThan(this.absoluteY, curr.top),
      lessThan(this.absoluteY, curr.bottom),
      lessThan(this.absoluteX, curr.right),
    ), i, prev,
  ), -1);

  render() {
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
          {this.props.areas && this.props.areas.length !== 0
          && <Animated.Code
            // Provoke change on reordering
            key={this.props.areas[0].id}
            exec={set(this.selectedIndex, this.calculateSelectedIndex())}
          />}
          <Animated.Code
            exec={
              block([
                onChange(
                  this.selectedIndex,
                  call([cond(eq(this.gestureState, State.ACTIVE), this.selectedIndex, -1)], ([i]) => {
                    this.props.updateSelectedID(i === -1 ? i : this.props.areas[i].id);
                  }),
                ),
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
  disabled, onPress, updateSelectedID, scrollViewTracker, areas, ...props
}) => (
  <Movable
    areas={areas}
    scrollViewTracker={scrollViewTracker}
    updateSelectedID={updateSelectedID}
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

const traverseSectionsToDimensions = ({ sections }) => {
  if (sections && sections.length === 2) {
    const areas = [];
    const headerHeight = 35;
    let height = 74 + headerHeight;
    for (let i = 0; i < sections[0].data.length; i++) {
      areas.push({
        bottom: height + CoinRow.height + (sections[0].data.length - 1 === i ? ListFooter.height : 0),
        id: sections[0].data[i].uniqueId,
        left: 0,
        right: deviceUtils.dimensions.width,
        top: height,
      });
      height += CoinRow.height + (sections[0].data.length - 1 === i ? ListFooter.height : 0);
    }
    height += headerHeight;
    return ({ areas });
  }
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
  withProps(traverseSectionsToDimensions),
  connect(null, { updateSelectedID }),
)(SendFab);
