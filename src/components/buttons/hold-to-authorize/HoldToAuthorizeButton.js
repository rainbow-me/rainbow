import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import {
  LongPressGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, { Easing } from 'react-native-reanimated';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../../styles';
import InnerBorder from '../../InnerBorder';
import { Centered } from '../../layout';
import { ShadowStack } from '../../shadow-stack';
import { Text } from '../../text';
import HoldToAuthorizeButtonIcon from './HoldToAuthorizeButtonIcon';

const { divide, multiply, timing, Value, View } = Animated;

const ButtonBorderRadius = 30;
const ButtonHeight = 59;

const ButtonDisabledBgColor = {
  dark: colors.darkGrey, // blueGreyLighter,
  light: colors.lightGrey,
};

const ButtonShadows = {
  default: [
    [0, 3, 5, colors.dark, 0.2],
    [0, 6, 10, colors.dark, 0.14],
    [0, 1, 18, colors.dark, 0.12],
  ],
  disabled: [
    [0, 2, 6, colors.dark, 0.06],
    [0, 3, 9, colors.dark, 0.08],
  ],
};

const progressDurationMs = 500; // @christian approves

const Content = styled(Centered)`
  ${padding(15)};
  border-radius: ${ButtonBorderRadius};
  flex-grow: 0;
  height: ${ButtonHeight};
  overflow: hidden;
  width: 100%;
`;

const Title = withProps({
  color: 'white',
  size: 'large',
  style: { marginBottom: 2 },
  weight: 'semibold',
})(Text);

const buildAnimation = (value, options) => {
  const { duration = 150, isInteraction = false, toValue } = options;

  return timing(value, {
    duration,
    easing: Easing.inOut(Easing.ease),
    isInteraction,
    toValue,
    useNativeDriver: true,
  });
};

const calculateReverseDuration = progess =>
  multiply(divide(progess, 100), progressDurationMs);

export default class HoldToAuthorizeButton extends PureComponent {
  static propTypes = {
    backgroundColor: PropTypes.string,
    children: PropTypes.any,
    disabled: PropTypes.bool,
    disabledBackgroundColor: PropTypes.string,
    hideBiometricIcon: PropTypes.bool,
    isAuthorizing: PropTypes.bool,
    label: PropTypes.string,
    onLongPress: PropTypes.func.isRequired,
    onPress: PropTypes.func,
    shadows: PropTypes.arrayOf(PropTypes.array),
    style: PropTypes.object,
    theme: PropTypes.oneOf(['light', 'dark']),
  };

  static defaultProps = {
    backgroundColor: colors.appleBlue,
    disabled: false,
    theme: 'light',
  };

  state = {
    isAuthorizing: false,
  };

  componentDidUpdate = () => {
    if (this.state.isAuthorizing && !this.props.isAuthorizing) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ isAuthorizing: false });
    }
  };

  scale = new Value(1);

  tapHandlerState = 1;

  animation = new Value(0);

  onTapChange = ({ nativeEvent: { state } }) => {
    const { disabled, onPress } = this.props;

    this.tapHandlerState = state;

    if (state === State.BEGAN) {
      if (disabled) {
        ReactNativeHapticFeedback.trigger('notificationWarning');
        buildAnimation(this.scale, { toValue: 0.99 }).start(() => {
          buildAnimation(this.scale, { toValue: 1 }).start();
        });
      } else {
        buildAnimation(this.scale, { toValue: 0.97 }).start();
        buildAnimation(this.animation, {
          duration: progressDurationMs,
          toValue: 100,
        }).start();
      }
    } else if (!disabled && state === State.ACTIVE) {
      if (onPress) {
        onPress();
      }
    } else if (!disabled && state === State.END) {
      buildAnimation(this.scale, { toValue: 1 }).start();
      buildAnimation(this.animation, {
        duration: calculateReverseDuration(this.animation),
        isInteraction: true,
        toValue: 0,
      }).start();
    }
  };

  onLongPressChange = ({ nativeEvent }) => {
    const { disabled, onLongPress } = this.props;

    if (!disabled && nativeEvent.state === State.ACTIVE) {
      ReactNativeHapticFeedback.trigger('notificationSuccess');

      buildAnimation(this.scale, {
        isInteraction: true,
        toValue: 1,
      }).start(() => this.setState({ isAuthorizing: true }));

      if (onLongPress) {
        onLongPress();
      }
    }
  };

  renderContent = () => {
    const { children, disabled, hideBiometricIcon, label } = this.props;

    const { isAuthorizing } = this.state;

    if (children) {
      return children;
    }

    return (
      <Fragment>
        {!disabled && !hideBiometricIcon && (
          <HoldToAuthorizeButtonIcon
            animatedValue={this.animation}
            isAuthorizing={isAuthorizing}
          />
        )}
        <Title>{isAuthorizing ? 'Authorizing' : label}</Title>
      </Fragment>
    );
  };

  render() {
    const {
      backgroundColor,
      disabled,
      disabledBackgroundColor,
      shadows,
      style,
      theme,
      ...props
    } = this.props;

    let bgColor = backgroundColor;
    if (disabled) {
      bgColor = disabledBackgroundColor || ButtonDisabledBgColor[theme];
    }

    return (
      <TapGestureHandler onHandlerStateChange={this.onTapChange}>
        <LongPressGestureHandler
          minDurationMs={progressDurationMs}
          onHandlerStateChange={this.onLongPressChange}
        >
          <View
            {...props}
            style={[style, { transform: [{ scale: this.scale }] }]}
          >
            <ShadowStack
              backgroundColor={bgColor}
              borderRadius={ButtonBorderRadius}
              height={ButtonHeight}
              shadows={
                shadows || ButtonShadows[disabled ? 'disabled' : 'default']
              }
              width="100%"
            >
              <Content backgroundColor={bgColor}>
                {this.renderContent()}
                <InnerBorder radius={ButtonBorderRadius} />
              </Content>
            </ShadowStack>
          </View>
        </LongPressGestureHandler>
      </TapGestureHandler>
    );
  }
}
