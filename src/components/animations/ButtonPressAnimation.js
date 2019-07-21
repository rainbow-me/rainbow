import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { InteractionManager } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated from 'react-native-reanimated';
import { transformOrigin as transformOriginUtil } from 'react-native-redash';
import { animations } from '../../styles';
import { directionPropType } from '../../utils';

const {
  divide,
  interpolate,
  spring,
  SpringUtils,
  Value,
} = Animated;

const springConfig = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
  ...SpringUtils.makeDefaultConfig(),
  friction: new Value(28),
  tension: 700,
});

let buttonExcludingMutex = null;

export default class ButtonPressAnimation extends PureComponent {
  static propTypes = {
    activeOpacity: PropTypes.number,
    children: PropTypes.any,
    defaultScale: PropTypes.number,
    disabled: PropTypes.bool,
    enableHapticFeedback: PropTypes.bool,
    isInteraction: PropTypes.bool,
    onPress: PropTypes.func,
    scaleTo: PropTypes.number,
    style: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    tapRef: PropTypes.object,
    transformOrigin: directionPropType,
    waitFor: PropTypes.any,
  }

  static defaultProps = {
    activeOpacity: 1,
    defaultScale: animations.keyframes.button.from.scale,
    enableHapticFeedback: true,
    isInteraction: true,
    scaleTo: animations.keyframes.button.to.scale,
  }

  state = {
    scaleOffsetX: 0,
    scaleOffsetY: 0,
  }

  animation = new Value(1)

  gestureState = null

  componentDidMount = () => this.runSpring()

  handleLayout = ({ nativeEvent: { layout } }) => {
    const { transformOrigin } = this.props;
    const { scaleOffsetX, scaleOffsetY } = this.state;

    const isFirstRender = !scaleOffsetX && !scaleOffsetY;

    if (isFirstRender && transformOrigin) {
      const directionMultiple = (transformOrigin === 'left' || transformOrigin === 'top') ? -1 : 1;

      this.setState({
        scaleOffsetX: directionMultiple * Math.floor(layout.width) / 2,
        scaleOffsetY: directionMultiple * Math.floor(layout.height) / 2,
      });
    }
  }

  handleStateChange = ({ nativeEvent: { absoluteX, absoluteY, state } }) => {
    const { enableHapticFeedback, onPress } = this.props;

    this.gestureState = state;
    const isActive = state === State.BEGAN;

    if (buttonExcludingMutex !== this) {
      if (buttonExcludingMutex === null && isActive) {
        buttonExcludingMutex = this;
      } else {
        return;
      }
    }


    if (state === State.END || state === State.FAILED || state === State.CANCELLED) {
      buttonExcludingMutex = null;
    }

    if (enableHapticFeedback && state === State.ACTIVE) {
      ReactNativeHapticFeedback.trigger('selection');
    }

    if (isActive) {
      this.initPos = { absoluteX, absoluteY };
    }
    this.runSpring();

    if (state === State.END && onPress) {
      // condition below covers issue when tap is simultaneous with pan
      const isValidX = Math.abs(this.initPos.absoluteX - absoluteX) < 5;
      const isValidY = Math.abs(this.initPos.absoluteY - absoluteY) < 5;

      if (isValidX && isValidY) {
        onPress();
      }
    }
  }

  runSpring = () => {
    const { defaultScale, isInteraction, scaleTo } = this.props;

    const handle = isInteraction && InteractionManager.createInteractionHandle();
    const toValue = (this.gestureState === State.BEGAN || this.gestureState === State.ACTIVE) ? scaleTo : defaultScale;

    const config = {
      ...springConfig,
      isInteraction,
      toValue,
    };

    return spring(this.animation, config).start(({ finished }) => {
      if (!finished || !isInteraction) return null;
      return InteractionManager.clearInteractionHandle(handle);
    });
  }

  render = () => {
    const {
      activeOpacity,
      children,
      defaultScale,
      disabled,
      scaleTo,
      style,
      tapRef,
      transformOrigin,
      waitFor,
    } = this.props;

    const { scaleOffsetX, scaleOffsetY } = this.state;

    const opacity = (scaleTo > defaultScale)
      ? activeOpacity
      : interpolate(divide(this.animation, defaultScale), {
        inputRange: [scaleTo, defaultScale],
        outputRange: [activeOpacity, 1],
      });

    const offsetX = (transformOrigin === 'left' || transformOrigin === 'right') ? scaleOffsetX : 0;
    const offsetY = (transformOrigin === 'bottom' || transformOrigin === 'top') ? scaleOffsetY : 0;
    const transform = transformOriginUtil(offsetX, offsetY, { scale: this.animation });

    return (
      <TapGestureHandler
        enabled={!disabled}
        onHandlerStateChange={this.handleStateChange}
        ref={tapRef}
        waitFor={waitFor}
      >
        <Animated.View
          onLayout={this.handleLayout}
          style={[{ opacity, transform }, style]}
        >
          {children}
        </Animated.View>
      </TapGestureHandler>
    );
  }
}
