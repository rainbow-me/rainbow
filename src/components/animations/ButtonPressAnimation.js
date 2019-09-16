import {
  isFunction,
  omit,
  pick,
  toUpper,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { InteractionManager } from 'react-native';
import {
  createNativeWrapper,
  LongPressGestureHandler,
  PureNativeButton,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, { Easing } from 'react-native-reanimated';
import {
  contains,
  runDelay,
  runTiming,
  transformOrigin as transformOriginUtil,
} from 'react-native-redash';
import stylePropType from 'react-style-proptype';
import { animations, colors } from '../../styles';
import { directionPropType } from '../../utils';

const {
  block,
  call,
  Clock,
  cond,
  createAnimatedComponent,
  divide,
  eq,
  event,
  floor,
  greaterThan,
  interpolate,
  multiply,
  onChange,
  or,
  set,
  Value,
} = Animated;

const {
  ACTIVE,
  BEGAN,
  CANCELLED,
  END,
  FAILED,
  UNDETERMINED,
} = State;

const TransformOriginMap = {
  BOTTOM: 3,
  LEFT: 4,
  RIGHT: 2,
  TOP: 1,
};

const {
  BOTTOM,
  LEFT,
  RIGHT,
  TOP,
} = TransformOriginMap;

const AnimatedRawButton = createNativeWrapper(
  createAnimatedComponent(PureNativeButton),
  {
    shouldActivateOnStart: true,
    shouldCancelWhenOutside: false,
  },
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
    easing: PropTypes.object,
    enableHapticFeedback: PropTypes.bool,
    exclusive: PropTypes.bool,
    hapticType: PropTypes.oneOf(Object.keys(HapticFeedbackTypes)),
    isInteraction: PropTypes.bool,
    onLongPress: PropTypes.func,
    onPress: PropTypes.func,
    onPressStart: PropTypes.func,
    scaleTo: PropTypes.number,
    style: stylePropType,
    tapRef: PropTypes.object,
    transformOrigin: directionPropType,
  }

  static defaultProps = {
    activeOpacity: 1,
    defaultScale: animations.keyframes.button.from.scale,
    duration: 200,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    enableHapticFeedback: true,
    exclusive: true,
    hapticType: HapticFeedbackTypes.selection,
    scaleTo: animations.keyframes.button.to.scale,
  }

  constructor(props) {
    super(props);

    this.clock = new Clock();
    this.gestureState = new Value(UNDETERMINED);
    this.handle = undefined;
    this.scale = new Value(1);
    this.shouldSpring = new Value(-1);

    this.state = {
      height: 0,
      width: 0,
    };

    this.transformOrigin = props.transformOrigin
      ? TransformOriginMap[toUpper(props.transformOrigin)]
      : undefined;

    const isDirectionNegative = or(
      eq(this.transformOrigin, LEFT),
      eq(this.transformOrigin, TOP),
    );

    this.directionMultiple = cond(isDirectionNegative, -1, 1);

    this.onGestureEvent = event([{
      nativeEvent: {
        state: this.gestureState,
      },
    }]);
  }

  componentWillUnmount = () => {
    this.clearInteraction();
  }

  clearInteraction = () => {
    if (this.props.isInteraction && this.handle) {
      InteractionManager.clearInteractionHandle(this.handle);
      this.handle = undefined;
    }
  }

  createInteraction = () => {
    if (this.props.isInteraction && !this.handle) {
      this.handle = InteractionManager.createInteractionHandle();
    }
  }

  handleHaptic = () => {
    const { enableHapticFeedback, hapticType } = this.props;

    if (enableHapticFeedback) {
      ReactNativeHapticFeedback.trigger(hapticType);
    }
  }

  handleLayout = ({ nativeEvent: { layout } }) => {
    // only setState if height+width dont already exist
    if (!Object.values(this.state).reduce((a, b) => a + b)) {
      this.setState(pick(layout, Object.keys(this.state)));
    }
  }

  handlePress = () => {
    if (this.props.onPress) {
      this.props.onPress();
    }
  }

  handlePressStart = () => {
    const { onPressStart } = this.props;

    if (onPressStart) {
      this.handleRunInteraction(onPressStart);
    }
  }

  handleRunInteraction = (functionToRun) => {
    const action = isFunction(functionToRun) ? functionToRun : this.handlePress;

    return this.props.isInteraction
      ? InteractionManager.runAfterInteractions(action)
      : action();
  }

  tapGesture = () => {
    const {
      activeOpacity,
      children,
      defaultScale,
      disabled,
      duration,
      easing,
      exclusive,
      scaleTo,
      style,
      tapRef,
      ...props
    } = this.props;

    const offsetX = cond(
      or(eq(this.transformOrigin, LEFT), eq(this.transformOrigin, RIGHT)),
      divide(multiply(floor(this.state.width), this.directionMultiple), 2),
      0,
    );

    const offsetY = cond(
      or(eq(this.transformOrigin, BOTTOM), eq(this.transformOrigin, TOP)),
      divide(multiply(floor(this.state.height), this.directionMultiple), 2),
      0,
    );

    const opacity = cond(
      greaterThan(scaleTo, defaultScale),
      activeOpacity,
      interpolate(divide(this.scale, defaultScale), {
        inputRange: [scaleTo, defaultScale],
        outputRange: [activeOpacity, 1],
      }),
    );

    const transform = transformOriginUtil(offsetX, offsetY, { scale: this.scale });

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
            onLayout={this.transformOrigin ? this.handleLayout : NOOP}
            style={[style, { opacity, transform }]}
          >
            {children}
          </Animated.View>
        </AnimatedRawButton>
        <Animated.Code
          exec={
            block([
              cond(
                or(eq(this.gestureState, ACTIVE), eq(this.gestureState, BEGAN)),
                set(this.shouldSpring, 1),
              ),
              cond(
                contains([FAILED, CANCELLED], this.gestureState),
                set(this.shouldSpring, 0),
              ),
              onChange(
                this.gestureState,
                cond(
                  eq(this.gestureState, BEGAN),
                  call([], [
                    this.createInteraction,
                    this.handlePressStart,
                  ]),
                  // else if
                  cond(
                    eq(this.gestureState, ACTIVE),
                    call([], this.createInteraction),
                    // else if
                    cond(
                      eq(this.gestureState, END),
                      [
                        call([], this.handleHaptic),
                        call([], this.handleRunInteraction),
                      ],
                    ),
                  ),
                ),
              ),
              cond(
                eq(this.gestureState, END),
                runDelay([
                  set(this.shouldSpring, 0),
                  call([], this.clearInteraction),
                ], duration),
              ),
              set(
                this.scale,
                runTiming(this.clock, this.scale, {
                  duration,
                  easing,
                  toValue: cond(eq(this.shouldSpring, 1), scaleTo, defaultScale),
                }),
              ),
            ])
          }
        />
      </Fragment>
    );
  }

  longPressGesture = () => {
    const {
      onLongPress,
    } = this.props;

    return (
      <LongPressGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) {
            if (onLongPress) {
              onLongPress();
            }
          }
        }}
        minDurationMs={800}>
        {this.tapGesture()}
      </LongPressGestureHandler>
    );
  }

  render = () => {
    const { onLongPress } = this.props;

    if (onLongPress) {
      return this.longPressGesture();
    }
    return this.tapGesture();
  }
}
