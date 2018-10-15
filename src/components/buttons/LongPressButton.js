import React, { Component } from 'react';
import Animated, { Easing } from 'react-native-reanimated';
import { LongPressGestureHandler, State, TapGestureHandler } from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import PropTypes from 'prop-types';

const {
  timing,
  Value,
  View,
} = Animated;

export default class LongPressButton extends Component {
  static propTypes = {
    children: PropTypes.any,
    disabled: PropTypes.bool,
    onLongPress: PropTypes.func,
    onPress: PropTypes.func,
    onRelease: PropTypes.func,
    style: PropTypes.object,
  };

  static defaultProps = {
    disabled: false,
    onLongPress() {},
    onPress() {},
    onRelease() {},
  };

  constructor(props) {
    super(props);

    this.scale = new Value(1);
  }

  onTapHandlerStateChange = ({ nativeEvent }) => {
    const { disabled, onPress, onRelease } = this.props;

    timing(this.scale, {
      toValue: (!disabled && nativeEvent.state === State.BEGAN) ? 0.875 : 1,
      duration: 150,
      easing: Easing.inOut(Easing.ease),
    }).start();

    console.log('here', nativeEvent)

    if (!disabled && nativeEvent.state === State.BEGAN) {
      onPress();
    } else if (!disabled && nativeEvent.state === State.END) {
      onRelease();
    }
  };

  onLongPressHandlerStateChange = ({ nativeEvent }) => {
    const { disabled, onLongPress } = this.props;

    if (!disabled && nativeEvent.state === State.ACTIVE) {
      ReactNativeHapticFeedback.trigger('impactHeavy');

      onLongPress();
    }
  };

  render() {
    const { children, style } = this.props;

    return (
      <TapGestureHandler onHandlerStateChange={this.onTapHandlerStateChange}>
        <LongPressGestureHandler onHandlerStateChange={this.onLongPressHandlerStateChange} minDurationMs={800}>
          <View style={[style, { transform: [{ scale: this.scale }] }]}>{children}</View>
        </LongPressGestureHandler>
      </TapGestureHandler>
    );
  }
}
