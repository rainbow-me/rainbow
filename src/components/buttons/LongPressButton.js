import React, { Component } from 'react';
import { InteractionManager } from 'react-native';
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

    if (nativeEvent.state === State.BEGAN) {
      if (disabled) {
        ReactNativeHapticFeedback.trigger('notificationWarning');

        timing(this.scale, {
          duration: 150,
          easing: Easing.inOut(Easing.ease),
          toValue: 0.975,
        }).start(() => {
          timing(this.scale, {
            toValue: 1,
            duration: 150,
            easing: Easing.inOut(Easing.ease),
          }).start();
        });
      } else {
        timing(this.scale, {
          toValue: 0.875,
          duration: 150,
          easing: Easing.inOut(Easing.ease),
        }).start();

        onPress();
      }
    } else if (!disabled && nativeEvent.state === State.END) {
      timing(this.scale, {
        duration: 150,
        easing: Easing.inOut(Easing.ease),
        toValue: 1,
      }).start();

      InteractionManager.runAfterInteractions(() => {
        onRelease();
      });
    }
  };

  onLongPressHandlerStateChange = ({ nativeEvent }) => {
    const { disabled, onLongPress } = this.props;

    if (!disabled && nativeEvent.state === State.ACTIVE) {
      ReactNativeHapticFeedback.trigger('impactHeavy');

      timing(this.scale, {
        toValue: 1,
        duration: 150,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        InteractionManager.runAfterInteractions(() => {
          onLongPress();
        });
      });
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
