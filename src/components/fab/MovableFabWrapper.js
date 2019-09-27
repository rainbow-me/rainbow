import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { compose, withProps } from 'recompact';
import {
  withFabSelection,
  withOpenBalances,
  withOpenFamilyTabs,
  withOpenInvestmentCards,
} from '../../hoc';
import { deviceUtils } from '../../utils';
import { CoinRow } from '../coin-row';
import { ListFooter } from '../list';
import {
  InvestmentCard,
  InvestmentCardHeader,
  UniswapInvestmentCard,
} from '../investment-cards';
import { CoinDivider } from '../coin-divider';
import { UniqueTokenRow } from '../unique-token';
import DeleteButton from './DeleteButton';

const {
  abs,
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
    cond(state.finished, [stopClock(clock), set(wasRunSpring, 1)]),
    state.position,
  ];
}

export const extraStates = {
  gestureInactive: -3,
  nothing: -1,
  notSendable: -4,
  overX: -2,
};

class MovableFabWrapper extends PureComponent {
  static propTypes = {
    actionType: PropTypes.string,
    areas: PropTypes.array,
    children: PropTypes.any,
    deleteButtonScale: PropTypes.object,
    scrollViewTracker: PropTypes.object,
    setActionType: PropTypes.func,
    setScrollingVelocity: PropTypes.func,
    tapRef: PropTypes.object,
    updateSelectedID: PropTypes.func,
  };

  static defaultProps = {
    scrollOffset: new Animated.Value(0),
  };

  absoluteX = new Animated.Value(0);

  absoluteY = new Animated.Value(0);

  clockX = new Clock();

  clockY = new Clock();

  dragX = new Animated.Value(0);

  dragY = new Animated.Value(0);

  dragVX = new Animated.Value(0);

  dragVY = new Animated.Value(0);

  gestureState = new Animated.Value(0);

  isOverDeleteButtonBoundary = position =>
    greaterThan(abs(position), DeleteButton.size * 2);

  key = 0;

  selectedIndex = new Animated.Value(0);

  springOffsetX = new Animated.Value(0);

  springOffsetY = new Animated.Value(0);

  translateX = add(this.dragX, this.springOffsetX);

  translateY = add(this.dragY, this.springOffsetY);

  wasRunSpring = new Animated.Value(0);

  xClockHide = new Clock();

  xClockShow = new Clock();

  calculateSelectedIndex = () =>
    cond(
      or(lessThan(this.absoluteY, 109), this.isOverX),
      extraStates.overX,
      this.props.areas.reduce(
        (prev, curr, i) =>
          cond(
            and(
              greaterThan(this.absoluteX, curr.left),
              greaterThan(
                add(this.absoluteY, this.props.scrollViewTracker),
                curr.top
              ),
              lessThan(
                add(this.absoluteY, this.props.scrollViewTracker),
                curr.bottom
              ),
              lessThan(this.absoluteX, curr.right)
            ),
            i,
            prev
          ),
        extraStates.nothing
      )
    );

  isOverX = and(
    greaterThan(this.absoluteY, deviceUtils.dimensions.height - 120),
    greaterThan(this.absoluteX, deviceUtils.dimensions.width - 100)
  );

  manageUpAndDownScrolling = cond(
    and(
      greaterThan(this.absoluteY, deviceUtils.dimensions.height - 20),
      not(this.isOverX)
    ),
    1,
    cond(lessThan(this.absoluteY, 120), 2, 0)
  );

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

  render() {
    const selectedIndexWithState = cond(
      eq(this.gestureState, State.ACTIVE),
      this.selectedIndex,
      extraStates.gestureInactive
    );

    const showDeleteButton = or(
      this.isOverDeleteButtonBoundary(this.translateX),
      this.isOverDeleteButtonBoundary(this.translateY)
    );

    return (
      <PanGestureHandler
        onGestureEvent={this.onGestureEvent}
        onHandlerStateChange={this.onHandlerStateChange}
        simultaneousHandlers={this.props.tapRef}
      >
        <Animated.View
          style={{
            transform: [
              { translateX: this.translateX },
              { translateY: this.translateY },
            ],
          }}
        >
          {this.props.areas && this.props.areas.length !== 0 && (
            <Animated.Code
              // Provoke change on reordering
              key={this.key++}
              exec={set(this.selectedIndex, this.calculateSelectedIndex())}
            />
          )}
          <Animated.Code
            exec={onChange(this.manageUpAndDownScrolling, [
              call([this.manageUpAndDownScrolling], ([v]) =>
                this.props.setScrollingVelocity(v === 1 ? 1 : v === 2 ? -1 : 0)
              ),
            ])}
          />
          <Animated.Code
            exec={block([
              cond(eq(this.gestureState, State.ACTIVE), [
                cond(
                  showDeleteButton,
                  set(
                    this.props.deleteButtonScale,
                    runSpring(
                      this.xClockShow,
                      this.props.deleteButtonScale,
                      0,
                      1
                    )
                  ),
                  set(
                    this.props.deleteButtonScale,
                    runSpring(
                      this.xClockShow,
                      this.props.deleteButtonScale,
                      0,
                      DeleteButton.defaultScale
                    )
                  )
                ),
                stopClock(this.xClockHide),
              ]),
              cond(
                and(
                  eq(this.gestureState, State.END),
                  neq(this.props.deleteButtonScale, DeleteButton.defaultScale)
                ),
                [
                  call([], () => this.props.setScrollingVelocity(0)),
                  set(
                    this.props.deleteButtonScale,
                    runSpring(
                      this.xClockHide,
                      this.props.deleteButtonScale,
                      0,
                      DeleteButton.defaultScale
                    )
                  ),
                  stopClock(this.xClockShow),
                ]
              ),
              onChange(
                selectedIndexWithState,
                call([selectedIndexWithState], ([i]) => {
                  this.props.updateSelectedID(
                    i < 0 ? i : this.props.areas[i].id
                  );
                })
              ),
              onChange(
                this.gestureState,
                cond(
                  eq(this.gestureState, State.END),
                  [
                    set(this.springOffsetX, this.translateX),
                    set(this.springOffsetY, this.translateY),
                    set(this.dragX, 0),
                    set(this.dragY, 0),
                  ],
                  cond(
                    eq(this.gestureState, State.BEGAN),
                    call([], () =>
                      this.props.setActionType(this.props.actionType)
                    )
                  )
                )
              ),
              cond(
                eq(this.gestureState, State.END),
                [
                  set(
                    this.springOffsetX,
                    runSpring(
                      this.clockX,
                      this.springOffsetX,
                      this.dragVX,
                      0,
                      this.wasRunSpring
                    )
                  ),
                  set(
                    this.springOffsetY,
                    runSpring(
                      this.clockY,
                      this.springOffsetY,
                      this.dragVY,
                      0,
                      this.wasRunSpring
                    )
                  ),
                ],
                [
                  stopClock(this.clockX),
                  stopClock(this.clockY),
                  set(this.wasRunSpring, 0),
                ]
              ),
            ])}
          />
          {this.props.children}
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

const traverseSectionsToDimensions = ({
  openFamilyTabs,
  openInvestmentCards,
  openSmallBalances,
  sections,
}) => {
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
      for (let i = 0; i < balances.data.length - 1; i++) {
        areas.push({
          bottom: height + CoinRow.height,
          id: balances.data[i].uniqueId,
          left: 0,
          right: deviceUtils.dimensions.width,
          top: height,
        });
        height += CoinRow.height;
      }
      areas.push({
        bottom: height + CoinDivider.height,
        id: 'smallBalancesHeader',
        left: 0,
        right: deviceUtils.dimensions.width,
        top: height,
      });
      height += CoinDivider.height;
      if (openSmallBalances) {
        const smallBalances = balances.data[balances.data.length - 1].assets;
        for (let i = 0; i < smallBalances.length; i++) {
          areas.push({
            bottom: height + CoinRow.height,
            id: smallBalances[i].uniqueId,
            left: 0,
            right: deviceUtils.dimensions.width,
            top: height,
          });
          height += CoinRow.height;
        }
      }
      height += ListFooter.height + headerHeight;
    }
    if (investments) {
      height += headerHeight + ListFooter.height;
      for (let i = 0; i < investments.data.length; i++) {
        if (!openInvestmentCards[investments.data[i].uniqueId]) {
          height +=
            UniswapInvestmentCard.height + InvestmentCard.margin.vertical;
        } else {
          height +=
            InvestmentCardHeader.height + InvestmentCard.margin.vertical;
        }
      }
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
              bottom: height + UniqueTokenRow.cardSize,
              id: tokens[j][k].isSendable
                ? tokens[j][k].uniqueId
                : extraStates.notSendable,
              left: k === 0 ? 0 : deviceUtils.dimensions.width / 2,
              right: deviceUtils.dimensions.width / (k === 0 ? 2 : 1),
              top: height,
            });
          }
          if (openFamilyTabs[collectibles.data[i].familyName]) {
            height += UniqueTokenRow.cardSize;
            if (j > 0) {
              height += UniqueTokenRow.cardMargin;
            }
          }
        }
      }
    }
    return { areas };
  }
  return null;
};

export default compose(
  withFabSelection,
  withOpenFamilyTabs,
  withOpenInvestmentCards,
  withOpenBalances,
  withProps(traverseSectionsToDimensions)
)(MovableFabWrapper);
