import { omit, pick } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { InteractionManager } from 'react-native';
import {
  createNativeWrapper,
  PureNativeButton,
  State,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, { Easing } from 'react-native-reanimated';
import {
  contains,
  transformOrigin as transformOriginUtil,
  timing,
} from 'react-native-redash';
import stylePropType from 'react-style-proptype';
import { animations, colors } from '../../styles';
import { directionPropType } from '../../utils';
import { interpolate } from './procs';

const {
  and,
  block,
  call,
  Clock,
  cond,
  createAnimatedComponent,
  divide,
  eq,
  event,
  greaterThan,
  lessThan,
  onChange,
  set,
  stopClock,
  Value,
} = Animated;

const { ACTIVE, CANCELLED, END, FAILED, UNDETERMINED } = State;

const AnimatedRawButton = createNativeWrapper(
  createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
    shouldCancelWhenOutside: true,
  }
);

const AnimatedRawButtonPropBlacklist = [
  'onLongPress',
  'onPress',
  'onPressStart',
];

const NOOP = () => undefined;

const HapticFeedbackTypes = {
  impactHeavy: 'impactHeavy',
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  notificationError: 'notificationError',
  notificationSuccess: 'notificationSuccess',
  notificationWarning: 'notificationWarning',
  selection: 'selection',
};

export default class ButtonPressAnimation extends PureComponent {
  static propTypes = {
    activeOpacity: PropTypes.number,
    children: PropTypes.any,
    defaultScale: PropTypes.number,
    disabled: PropTypes.bool,
    duration: PropTypes.number,
    easing: PropTypes.func,
    enableHapticFeedback: PropTypes.bool,
    exclusive: PropTypes.bool,
    hapticType: PropTypes.oneOf(Object.keys(HapticFeedbackTypes)),
    isInteraction: PropTypes.bool,
    minLongPressDuration: PropTypes.number,
    onLongPress: PropTypes.func,
    onPress: PropTypes.func,
    onPressStart: PropTypes.func,
    scaleTo: PropTypes.number,
    style: stylePropType,
    tapRef: PropTypes.object,
    transformOrigin: directionPropType,
  };

  static defaultProps = {
    activeOpacity: 1,
    defaultScale: animations.keyframes.button.from.scale,
    duration: 200,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    enableHapticFeedback: true,
    exclusive: true,
    hapticType: HapticFeedbackTypes.selection,
    minLongPressDuration: 500,
    scaleTo: animations.keyframes.button.to.scale,
  };

  constructor(props) {
    super(props);

    this.clock = new Clock();
    this.clockReversed = new Clock();
    this.delayClock = new Clock();
    this.gestureState = new Value(UNDETERMINED);
    this.handle = undefined;
    this.longPressDetected = false;
    this.longPressTimeout = undefined;
    this.scale = new Value(1);
    this.shouldSpring = new Value(-1);

    this.state = {
      height: 0,
      width: 0,
    };

    this.onGestureEvent = event([
      {
        nativeEvent: {
          state: this.gestureState,
        },
      },
    ]);
  }

  componentWillUnmount = () => {
    this.reset();
  };

  clearInteraction = () => {
    if (this.props.isInteraction && this.handle) {
      InteractionManager.clearInteractionHandle(this.handle);
      this.handle = undefined;
    }
  };

  clearLongPressListener = () => {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
    }
  };

  createInteraction = () => {
    if (this.props.isInteraction && !this.handle) {
      this.handle = InteractionManager.createInteractionHandle();
    }
  };

  createLongPressListener = () => {
    const { minLongPressDuration, onLongPress } = this.props;
    if (onLongPress) {
      this.longPressTimeout = setTimeout(
        this.handleDetectedLongPress,
        minLongPressDuration
      );
    }
  };

  handleHaptic = () => {
    const { enableHapticFeedback, hapticType } = this.props;

    if (enableHapticFeedback) {
      ReactNativeHapticFeedback.trigger(hapticType);
    }
  };

  handleLayout = ({ nativeEvent: { layout } }) => {
    // only setState if height+width dont already exist
    if (!Object.values(this.state).reduce((a, b) => a + b)) {
      this.setState(prevState => pick(layout, Object.keys(prevState)));
    }
  };

  handleDetectedLongPress = () => {
    this.longPressDetected = true;
    this.handleHaptic();
    this.props.onLongPress();
  };

  handlePress = () => {
    if (!this.longPressDetected && this.props.onPress) {
      this.handleHaptic();
      this.props.onPress();
    }
  };

  handlePressStart = () => {
    if (this.props.onPressStart) {
      this.props.onPressStart();
    }
  };

  reset = () => {
    this.clearInteraction();
    this.clearLongPressListener();
  };

  render = () => {
    const {
      activeOpacity,
      children,
      defaultScale,
      disabled,
      exclusive,
      scaleTo,
      style,
      transformOrigin,
      tapRef,
      ...props
    } = this.props;

    const { height, width } = this.state;

    let offsetX = 0;
    let offsetY = 0;

    if (transformOrigin === 'left' || transformOrigin === 'right') {
      offsetX = Math.floor(width / 2) * (transformOrigin === 'left' ? -1 : 1);
    } else if (transformOrigin === 'bottom' || transformOrigin === 'top') {
      offsetY = Math.floor(height / 2) * (transformOrigin === 'top' ? -1 : 1);
    }

    const scaleDiff = 1 - (this.props.defaultScale - this.props.scaleTo) / 2;

    const opacity =
      scaleTo > defaultScale
        ? activeOpacity
        : interpolate(divide(this.scale, defaultScale), {
            inputRange: [scaleTo, defaultScale],
            outputRange: [activeOpacity, 1],
          });

    return (
      <Fragment>
        <AnimatedRawButton
          {...omit(props, AnimatedRawButtonPropBlacklist)}
          backgroundColor={colors.transparent}
          enabled={!disabled}
          exclusive={exclusive}
          onGestureEvent={this.onGestureEvent}
          onHandlerStateChange={this.onGestureEvent}
          ref={tapRef}
        >
          <Animated.View
            accessible
            onLayout={transformOrigin ? this.handleLayout : NOOP}
            style={[
              style,
              {
                opacity,
                transform: transformOriginUtil(offsetX, offsetY, {
                  scale: this.scale,
                }),
              },
            ]}
          >
            {children}
          </Animated.View>
        </AnimatedRawButton>
        <Animated.Code
          exec={block([
            cond(eq(this.gestureState, ACTIVE), [
              set(this.shouldSpring, 1),
              stopClock(this.clockReversed),
            ]),
            cond(contains([FAILED, CANCELLED, END], this.gestureState), [
              cond(
                lessThan(this.scale, scaleDiff),
                block([stopClock(this.clock), set(this.shouldSpring, 0)])
              ),
              call([], this.reset),
            ]),
            onChange(
              this.gestureState,
              cond(
                eq(this.gestureState, ACTIVE),
                [
                  call([], this.createInteraction),
                  call([], this.createLongPressListener),
                  call([], this.handlePressStart),
                ],
                cond(eq(this.gestureState, END), [call([], this.handlePress)])
              )
            ),
            cond(
              and(greaterThan(this.scale, 0), eq(this.shouldSpring, 1)),
              set(
                this.scale,
                timing({
                  clock: this.clock,
                  duration: this.props.duration,
                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                  from: this.scale,
                  to: this.props.scaleTo,
                })
              )
            ),
            cond(
              and(lessThan(this.scale, 1), eq(this.shouldSpring, 0)),
              set(
                this.scale,
                timing({
                  clock: this.clockReversed,
                  duration: this.props.duration,
                  easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
                  from: this.scale,
                  to: this.props.defaultScale,
                })
              )
            ),
          ])}
        />
      </Fragment>
    );
  };
}
