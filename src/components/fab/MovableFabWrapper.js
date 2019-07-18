import PropTypes from 'prop-types';
import React from 'react';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { withOpenFamilyTabs } from '../../hoc';
import {
  setActionType,
  setScrollingVelocity,
  updateSelectedID,
} from '../../redux/selectedWithFab';
import { deviceUtils } from '../../utils';
import { CoinRow } from '../coin-row';
import { ListFooter } from '../list';
import { CardSize, CardMargin } from '../unique-token/UniqueTokenRow';
import { InvestmentCard, UniswapInvestmentCard } from '../investment-cards';

const {
  add,
  and,
  block,
  call,
  Clock,
  clockRunning,
  cond,
  eq,
  event,
  greaterThan,
  lessThan,
  neq,
  not,
  onChange,
  or,
  set,
  spring,
  startClock,
  stopClock,
  Value,
} = Animated;

function runSpring(
  clock,
  value,
  velocity,
  dest,
  wasRunSpring = false,
) {
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

export const extraStates = {
  gestureInactive: -3,
  nothing: -1,
  notSendable: -4,
  overX: -2,
};


class Movable extends React.Component {
  static propTypes = {
    actionType: PropTypes.string,
    areas: PropTypes.array,
    children: PropTypes.any,
    deleteButtonTranslate: PropTypes.object,
    openFamilyTabs: PropTypes.array,
    scrollViewTracker: PropTypes.object,
    sections: PropTypes.array,
    setActionType: PropTypes.func,
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

  key = 0;

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
    greaterThan(this.absoluteY, deviceUtils.dimensions.height - 120),
    greaterThan(this.absoluteX, deviceUtils.dimensions.width - 100),
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
              key={this.key++}
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
                  call([selectedIndexWithState], ([i]) => {
                    this.props.updateSelectedID(i < 0 ? i : this.props.areas[i].id);
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
                    cond(
                      eq(this.gestureState, State.ACTIVE),
                      call([], () => this.props.setActionType(this.props.actionType)),
                    ),
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

const traverseSectionsToDimensions = ({ sections, openFamilyTabs }) => {
  let balances = false;
  let collectibles = false;
  let investments = false;
  sections.forEach(section => {
    if (section.balances) {
      balances = section;
    } else if (section.collectibles) {
      collectibles = section;
    } else if (section.investments) {
      investments = section;
    }
  });
  if (sections) {
    const areas = [];
    const headerHeight = 54;
    const familyHeaderHeight = 52;
    let height = 55 + headerHeight;
    if (balances) {
      for (let i = 0; i < balances.data.length; i++) {
        areas.push({
          bottom: height + CoinRow.height,
          id: balances.data[i].uniqueId,
          left: 0,
          right: deviceUtils.dimensions.width,
          top: height,
        });
        height += CoinRow.height + (balances.data.length - 1 === i ? ListFooter.height : 0);
      }
      height += headerHeight;
    }
    if (investments) {
      height += headerHeight;
      height += investments.data.length * (UniswapInvestmentCard.height + InvestmentCard.margin.vertical) + ListFooter.height;
    }
    if (collectibles) {
      for (let i = 0; i < collectibles.data.length; i++) {
        const { tokens } = collectibles.data[i];
        areas.push({
          bottom: height + familyHeaderHeight,
          id: collectibles.data[i].familyName,
          left: 0,
          right: deviceUtils.dimensions.width,
          top: height,
        });
        height += familyHeaderHeight;
        for (let j = 0; j < tokens.length; j++) {
          for (let k = 0; k < tokens[j].length; k++) {
            areas.push({
              bottom: height + CardSize,
              id: tokens[j][k].isSendable ? tokens[j][k].uniqueId : extraStates.notSendable,
              left: k === 0 ? 0 : deviceUtils.dimensions.width / 2,
              right: deviceUtils.dimensions.width / (k === 0 ? 2 : 1),
              top: height,
            });
          }
          if (openFamilyTabs[i]) {
            height += CardSize;
            if (j > 0) {
              height += CardMargin;
            }
          }
        }
      }
    }
    return ({ areas });
  }
  return null;
};

const EnhancedMovable = compose(
  connect(null, {
    setActionType,
    setScrollingVelocity,
    updateSelectedID,
  }),
  withProps(traverseSectionsToDimensions),
)(Movable);


export default withOpenFamilyTabs(EnhancedMovable);
