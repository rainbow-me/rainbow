import { compact } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Animated } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { animations } from '../../styles';
import { directionPropType } from '../../utils';

const ButtonKeyframes = animations.keyframes.button;

const DefaultAnimatedValues = {
  opacity: 1,
  scale: ButtonKeyframes.from.scale,
  transX: 0,
};

let buttonExcludingMutex = null;

export default class ButtonPressAnimation extends PureComponent {
  static propTypes = {
    activeOpacity: PropTypes.number,
    children: PropTypes.any,
    disabled: PropTypes.bool,
    enableHapticFeedback: PropTypes.bool,
    onPress: PropTypes.func,
    scaleTo: PropTypes.number,
    style: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    transformOrigin: directionPropType,
  }

  static defaultProps = {
    enableHapticFeedback: true,
    scaleTo: ButtonKeyframes.to.scale,
  }

  state = { scaleOffsetX: null }

  opacity = new Animated.Value(DefaultAnimatedValues.opacity)

  scale = new Animated.Value(DefaultAnimatedValues.scale)

  transX = new Animated.Value(DefaultAnimatedValues.transX)

  componentWillUnmount = () => {
    this.opacity.stopAnimation();
    this.scale.stopAnimation();
    this.transX.stopAnimation();
  }

  handleLayout = ({ nativeEvent: { layout } }) => {
    const { scaleTo, transformOrigin } = this.props;

    if (transformOrigin) {
      const width = Math.floor(layout.width);
      const scaleOffsetX = (width - (width * scaleTo)) / 2;
      this.setState({ scaleOffsetX });
    }
  }

  handleStateChange = ({ nativeEvent: { state } }) => {
    const {
      activeOpacity,
      enableHapticFeedback,
      onPress,
      scaleTo,
      transformOrigin,
    } = this.props;
    const { scaleOffsetX } = this.state;

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

    const animationsArray = [
      // Default spring animation
      animations.buildSpring({
        config: {
          isInteraction: false,
        },
        from: ButtonKeyframes.from.scale,
        isActive,
        to: scaleTo,
        value: this.scale,
      }),
    ];

    if (activeOpacity) {
      // Opacity animation
      animationsArray.push(animations.buildSpring({
        config: {
          isInteraction: false,
        },
        from: DefaultAnimatedValues.opacity,
        isActive,
        to: activeOpacity,
        value: this.opacity,
      }));
    }

    if (scaleOffsetX) {
      // Fake 'transform-origin' support by abusing translateX
      const directionMultiple = (transformOrigin === 'left') ? -1 : 1;
      animationsArray.push(animations.buildSpring({
        config: {
          isInteraction: false,
        },
        from: DefaultAnimatedValues.transX,
        isActive,
        to: scaleOffsetX * (directionMultiple),
        value: this.transX,
      }));
    }

    // Start animations
    Animated.parallel(animationsArray).start();

    if (enableHapticFeedback && state === State.ACTIVE) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }

    if (state === State.END && onPress) {
      onPress();
    }
  }

  buildAnimationStyles = () => {
    const { activeOpacity, transformOrigin } = this.props;
    return ({
      ...(activeOpacity ? { opacity: this.opacity } : {}),
      transform: compact([
        transformOrigin ? { translateX: this.transX } : null,
        { scale: this.scale },
      ]),
    });
  }

  render() {
    const { children, disabled, style } = this.props;

    return (
      <TapGestureHandler enabled={!disabled} onHandlerStateChange={this.handleStateChange}>
        <Animated.View onLayout={this.handleLayout} style={[style, this.buildAnimationStyles()]}>
          {children}
        </Animated.View>
      </TapGestureHandler>
    );
  }
}
