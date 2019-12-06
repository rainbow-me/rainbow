import PropTypes from 'prop-types';
import React from 'react';
import { TouchableWithoutFeedback, Animated } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import stylePropType from 'react-style-proptype';

const HapticFeedbackTypes = {
  impactHeavy: 'impactHeavy',
  impactLight: 'impactLight',
  impactMedium: 'impactMedium',
  notificationError: 'notificationError',
  notificationSuccess: 'notificationSuccess',
  notificationWarning: 'notificationWarning',
  selection: 'selection',
};

export default class TouchableScale extends React.Component {
  constructor(...args) {
    super(...args);
    const props = this.props;

    this.onPressIn = this.onPressIn.bind(this);
    this.onPressOut = this.onPressOut.bind(this);
    this.scaleAnimation = new Animated.Value(props.defaultScale);
  }

  handleHaptic = () => {
    const { enableHapticFeedback, hapticType } = this.props;

    if (enableHapticFeedback) {
      ReactNativeHapticFeedback.trigger(hapticType);
    }
  };

  onPressIn(...args) {
    const props = this.props;
    const friction =
      typeof props.pressInFriction !== 'undefined'
        ? props.pressInFriction
        : props.friction;
    const tension =
      typeof props.pressInTension !== 'undefined'
        ? props.pressInTension
        : props.tension;

    Animated.spring(this.scaleAnimation, {
      friction: friction,
      tension: tension,
      toValue: props.activeScale,
      useNativeDriver: props.useNativeDriver,
    }).start();

    if (props.onPressIn) {
      props.onPressIn(...args);
    }
  }

  onPressOut(...args) {
    const props = this.props;
    const tension =
      typeof props.pressOutTension !== 'undefined'
        ? props.pressOutTension
        : props.tension;
    const friction =
      typeof props.pressOutFriction !== 'undefined'
        ? props.pressOutFriction
        : props.friction;

    Animated.spring(this.scaleAnimation, {
      friction: friction,
      tension: tension,
      toValue: props.defaultScale,
      useNativeDriver: props.useNativeDriver,
    }).start();

    this.handleHaptic();

    if (props.onPressOut) {
      props.onPressOut(...args);
    }
  }

  render() {
    const props = this.props;

    return (
      <TouchableWithoutFeedback
        // todo: pass only TouchableWithoutFeedback's props.
        {...props}
        onPressIn={this.onPressIn}
        onPressOut={this.onPressOut}
      >
        <Animated.View
          style={[
            props.style,
            {
              transform: [{ scale: this.scaleAnimation }],
            },
          ]}
        >
          {props.children}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  }
}

TouchableScale.propTypes = {
  ...TouchableWithoutFeedback.propTypes,
  activeScale: PropTypes.number.isRequired,
  defaultScale: PropTypes.number.isRequired,
  enableHapticFeedback: PropTypes.bool,
  friction: PropTypes.number.isRequired,
  hapticType: PropTypes.oneOf(Object.keys(HapticFeedbackTypes)),
  pressInFriction: PropTypes.number,
  pressInTension: PropTypes.number,
  pressOutFriction: PropTypes.number,
  pressOutTension: PropTypes.number,
  style: stylePropType,
  tension: PropTypes.number.isRequired,
  useNativeDriver: PropTypes.bool,
};

TouchableScale.defaultProps = {
  activeScale: 0.9,
  defaultScale: 1,
  enableHapticFeedback: true,
  friction: 3,
  hapticType: HapticFeedbackTypes.selection,
  tension: 150,
  useNativeDriver: true,
};
