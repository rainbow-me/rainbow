import { compact } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Animated } from 'react-native';
import { State, TapGestureHandler } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { animations } from '../../styles';
import { directionPropType } from '../../utils';

const ButtonKeyframes = animations.keyframes.button;

const DefaultAnimatedValues = {
  opacity: 0,
  scale: ButtonKeyframes.from.scale,
  transX: 0,
};

export default class ButtonPressAnimation extends Component {
  static propTypes = {
    activeOpacity: PropTypes.number,
    children: PropTypes.any,
    disabled: PropTypes.bool,
    onPress: PropTypes.func.isRequired,
    style: PropTypes.oneOf([PropTypes.object, PropTypes.number]),
    transformOrigin: directionPropType,
  }

  state = { scaleOffsetX: null }

  opacity = new Animated.Value(DefaultAnimatedValues.opacity)
  scale = new Animated.Value(DefaultAnimatedValues.scale)
  transX = new Animated.Value(DefaultAnimatedValues.transX)

  handleLayout = ({ nativeEvent: { layout } }) => {
    if (this.props.transformOrigin) {
      const width = Math.floor(layout.width);
      const scaleOffsetX = (width - (width * ButtonKeyframes.to.scale)) / 2;
      this.setState({ scaleOffsetX });
    }
  }

  handleStateChange = ({ nativeEvent: { state } }) => {
    const { activeOpacity, onPress, transformOrigin } = this.props;
    const { scaleOffsetX } = this.state;

    const isActive = state === State.BEGAN;

    const animationsArray = [
      // Default spring animation
      animations.buildSpring({
        from: ButtonKeyframes.from.scale,
        isActive,
        to: ButtonKeyframes.to.scale,
        value: this.scale,
      }),
    ];

    if (activeOpacity) {
      // Opacity animation
      animationsArray.push(animations.buildSpring({
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
        from: DefaultAnimatedValues.transX,
        isActive,
        to: scaleOffsetX * (directionMultiple),
        value: this.transX,
      }));
    }

    // Start animations
    Animated.parallel(animationsArray).start();

    if (state === State.BEGAN) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }

    if (state === State.END) {
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
