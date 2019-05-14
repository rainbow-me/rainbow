import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import {
  compose,
  omitProps,
  onlyUpdateForKeys,
  pure,
  withHandlers,
  withProps,
} from 'recompact';
import connect from 'react-redux/es/connect/connect';
import Icon from '../icons/Icon';
import FloatingActionButton from './FloatingActionButton';
import { deviceUtils } from '../../utils';
import { CoinRow } from '../coin-row';
import { ListFooter } from '../list';
import { setScrollingVelocity, updateSelectedID } from '../../redux/selectedWithFab';
import { CardSize } from '../unique-token/UniqueTokenRow';

const {
  set,
  cond,
  eq,
  or,
  add,
  and,
  greaterThan,
  not,
  lessThan,
  spring,
  call,
  neq,
  onChange,
  block,
  startClock,
  stopClock,
  clockRunning,
  Value,
  Clock,
  event,
} = Animated;

function runSpring(clock, value, velocity, dest, wasRunSpring = false) {
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

const extraStates = {
  gestureInactive: -3,
  nothing: -1,
  notSendable: -4,
  overX: -2,
};


class Movable extends React.Component {
  static propTypes = {
    areas: PropTypes.array,
    children: PropTypes.any,
    deleteButtonTranslate: PropTypes.object,
    scrollViewTracker: PropTypes.object,
    setScrollingVelocity: PropTypes.func,
    tapRef: PropTypes.object,
    updateSelectedID: PropTypes.func,
  };

  static defaultProps = {
    scrollOffset: new Animated.Value(0),
  };

  dragX = new Animated.Value(0);

  selectedIndex = new Animated.Value(0);

  absoluteX = new Animated.Value(0);

  absoluteY = new Animated.Value(0);

  dragY = new Animated.Value(0);

  dragVX = new Animated.Value(0);

  dragVY = new Animated.Value(0);

  gestureState = new Animated.Value(0);

  springOffsetX = new Animated.Value(0);

  springOffsetY = new Animated.Value(0);

  clockX = new Clock();

  clockY = new Clock();

  wasRunSpring = new Animated.Value(0);

  xClockHide = new Clock();

  xClockShow = new Clock();

  onGestureEvent = event([
    {
      nativeEvent: {
        absoluteX: this.absoluteX,
        absoluteY: this.absoluteY,
        state: this.gestureState,
        translationX: this.dragX,
        translationY: this.dragY,
        velocityX: this.dragVX,
        velocityY: this.dragVY,
      },
    },
  ]);

  onHandlerStateChange = event([
    {
      nativeEvent: {
        state: this.gestureState,
      },
    },
  ]);

  isOverX = and(
    greaterThan(this.absoluteY, deviceUtils.dimensions.height - 90),
    greaterThan(this.absoluteX, (deviceUtils.dimensions.width / 2) - 50),
    lessThan(this.absoluteX, (deviceUtils.dimensions.width / 2) + 50),
  );

  calculateSelectedIndex = () => cond(
    or(
      lessThan(this.absoluteY, 109),
      this.isOverX,
    ),
    extraStates.overX,
    this.props.areas.reduce((prev, curr, i) => cond(
      and(
        greaterThan(this.absoluteX, curr.left),
        greaterThan(add(this.absoluteY, this.props.scrollViewTracker), curr.top),
        lessThan(add(this.absoluteY, this.props.scrollViewTracker), curr.bottom),
        lessThan(this.absoluteX, curr.right),
      ), i, prev,
    ), extraStates.nothing),
  );

  manageUpAndDownScrolling = cond(
    and(greaterThan(this.absoluteY, deviceUtils.dimensions.height - 20), not(this.isOverX)),
    1,
    cond(lessThan(this.absoluteY, 120), 2, 0),
  );

  render() {
    const selectedIndexWithState = cond(eq(this.gestureState, State.ACTIVE), this.selectedIndex, extraStates.gestureInactive);
    return (
      <PanGestureHandler
        simultaneousHandlers={this.props.tapRef}
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
            exec={onChange(this.manageUpAndDownScrolling, [
              // eslint-disable-next-line no-nested-ternary
              call([this.manageUpAndDownScrolling], ([v]) => this.props.setScrollingVelocity(v === 1 ? 1 : (v === 2 ? -1 : 0))),
            ])}
          />
          <Animated.Code
            exec={
              block([
                cond(
                  and(eq(this.gestureState, State.ACTIVE), neq(this.props.deleteButtonTranslate, 0)),
                  [
                    set(this.props.deleteButtonTranslate, runSpring(this.xClockShow, this.props.deleteButtonTranslate, 0, 0)),
                    stopClock(this.xClockHide),
                  ],
                ),
                cond(
                  and(eq(this.gestureState, State.END), neq(this.props.deleteButtonTranslate, 100)),
                  [
                    call([], () => this.props.setScrollingVelocity(0)),
                    set(this.props.deleteButtonTranslate, runSpring(this.xClockHide, this.props.deleteButtonTranslate, 0, 100)),
                    stopClock(this.xClockShow),
                  ],
                ),
                onChange(
                  selectedIndexWithState,
                  call([selectedIndexWithState], ([i]) => this.props.updateSelectedID(i < 0 ? i : this.props.areas[i].id)),
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

const EnhancedMovable = connect(null, { setScrollingVelocity, updateSelectedID })(Movable);

const mapStateToProps = ({
  selectedWithFab: {
    selectedId,
  },
}) => ({
  selectedId,
});

const FloatingActionButtonWithDisabled = compose(
  connect(mapStateToProps),
  withProps(({ selectedId }) => ({ greyed: selectedId === extraStates.notSendable, size: FloatingActionButton.size })),
  omitProps('selectedId'),
)(FloatingActionButton);

const SendFab = ({
  disabled, onPress, deleteButtonTranslate, scrollViewTracker, areas, tapRef, ...props
}) => (
  <EnhancedMovable
    tapRef={tapRef}
    areas={areas}
    scrollViewTracker={scrollViewTracker}
    updateSelectedID={updateSelectedID}
    deleteButtonTranslate={deleteButtonTranslate}
  >
    <FloatingActionButtonWithDisabled
      tapRef={tapRef}
      {...props}
      scaleTo={1.1}
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
    </FloatingActionButtonWithDisabled>
  </EnhancedMovable>
);


SendFab.propTypes = {
  areas: PropTypes.array,
  children: PropTypes.any,
  deleteButtonTranslate: PropTypes.object,
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.array,
  tapRef: PropTypes.object,
};

const traverseSectionsToDimensions = ({ sections }) => {
  if (sections && sections.length === 2) {
    const areas = [];
    const headerHeight = 35;
    let height = 74 + headerHeight;
    for (let i = 0; i < sections[0].data.length; i++) {
      areas.push({
        bottom: height + CoinRow.height,
        id: sections[0].data[i].uniqueId,
        left: 0,
        right: deviceUtils.dimensions.width,
        top: height,
      });
      height += CoinRow.height + (sections[0].data.length - 1 === i ? ListFooter.height : 0);
    }

    height += 50;

    for (let i = 0; i < sections[1].data.length; i++) {
      const { tokens } = sections[1].data[i];
      for (let j = 0; j < tokens.length; j++) {
        areas.push({
          bottom: height + CardSize,
          id: tokens[j].isSendable ? tokens[j].uniqueId : extraStates.notSendable,
          left: j === 0 ? 0 : deviceUtils.dimensions.width / 2,
          right: deviceUtils.dimensions.width / (j === 0 ? 2 : 1),
          top: height,
        });
      }
      height += 15 + CardSize;
    }

    return ({ areas });
  }
  return null;
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
  withProps({
    tapRef: React.createRef(),
  }),
)(SendFab);
