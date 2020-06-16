import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { Keyboard } from 'react-native';
import {
  LongPressGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, { Easing, timing, Value } from 'react-native-reanimated';
import ShadowStack from 'react-native-shadow-stack';
import { withProps } from 'recompact';
import styled from 'styled-components/primitives';
import BiometryTypes from '../../../helpers/biometryTypes';
import { useBiometryType } from '../../../hooks';
import { colors, padding } from '../../../styles';
import { haptics } from '../../../utils';
import { Centered, InnerBorder } from '../../layout';
import { Text } from '../../text';
import HoldToAuthorizeButtonIcon from './HoldToAuthorizeButtonIcon';

const { divide, multiply, proc } = Animated;

const { ACTIVE, BEGAN, END, FAILED } = State;

const ButtonBorderRadius = 30;
const ButtonHeight = 59;

const ButtonDisabledBgColor = {
  dark: colors.darkGrey,
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

const buttonScaleDurationMs = 150;
const longPressProgressDurationMs = 500; // @christian approves

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
  size: 'larger',
  style: { marginBottom: 4 },
  weight: 'semibold',
})(Text);

const animate = (value, { duration = buttonScaleDurationMs, toValue }) =>
  timing(value, {
    duration,
    easing: Easing.inOut(Easing.ease),
    toValue,
  });

const calculateReverseDuration = proc(longPressProgress =>
  multiply(divide(longPressProgress, 100), longPressProgressDurationMs)
);

class HoldToAuthorizeButton extends PureComponent {
  static propTypes = {
    backgroundColor: PropTypes.string,
    biometryType: PropTypes.string,
    children: PropTypes.any,
    disabled: PropTypes.bool,
    disabledBackgroundColor: PropTypes.string,
    hideBiometricIcon: PropTypes.bool,
    hideInnerBorder: PropTypes.bool,
    isAuthorizing: PropTypes.bool,
    label: PropTypes.string,
    onLongPress: PropTypes.func.isRequired,
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
      this.onFinishAuthorizing();
    }
  };

  buttonScale = new Value(1);

  longPressProgress = new Value(0);

  onFinishAuthorizing = () => {
    if (!this.props.disabled) {
      animate(this.longPressProgress, {
        duration: calculateReverseDuration(this.longPressProgress),
        toValue: 0,
      }).start(() => this.setState({ isAuthorizing: false }));
    }
  };

  handlePress = () => {
    if (this.props.onLongPress) {
      this.props.onLongPress();
    }
  };

  onLongPressChange = ({ nativeEvent: { state } }) => {
    const { disabled } = this.props;

    if (state === ACTIVE && !disabled) {
      haptics.notificationSuccess();
      Keyboard.dismiss();

      animate(this.buttonScale, {
        toValue: 1,
      }).start(() => this.setState({ isAuthorizing: true }));

      this.handlePress();
    }
  };

  onTapChange = ({ nativeEvent: { state } }) => {
    const { disabled, enableLongPress } = this.props;

    if (disabled) {
      if (state === END) {
        haptics.notificationWarning();
        animate(this.buttonScale, { toValue: 1.02 }).start(() => {
          animate(this.buttonScale, { toValue: 1 }).start();
        });
      }
    } else {
      if (state === ACTIVE) {
        if (!enableLongPress) {
          this.handlePress();
        }
      } else if (state === BEGAN) {
        animate(this.buttonScale, { toValue: 0.97 }).start();
        if (enableLongPress) {
          animate(this.longPressProgress, {
            duration: longPressProgressDurationMs,
            toValue: 100,
          }).start();
        }
      } else if (state === END || state === FAILED) {
        animate(this.buttonScale, { toValue: 1 }).start();
        if (enableLongPress) {
          animate(this.longPressProgress, {
            duration: calculateReverseDuration(this.longPressProgress),
            toValue: 0,
          }).start();
        }
      }
    }
  };

  render() {
    const {
      backgroundColor,
      biometryType,
      children,
      disabled,
      disabledBackgroundColor,
      enableLongPress,
      hideBiometricIcon,
      hideInnerBorder,
      label,
      shadows,
      style,
      theme,
      ...props
    } = this.props;

    const { isAuthorizing } = this.state;

    let bgColor = backgroundColor;
    if (disabled) {
      bgColor = disabledBackgroundColor || ButtonDisabledBgColor[theme];
    }

    return (
      <TapGestureHandler onHandlerStateChange={this.onTapChange}>
        <LongPressGestureHandler
          enableLongPress={enableLongPress}
          minDurationMs={longPressProgressDurationMs}
          onHandlerStateChange={this.onLongPressChange}
        >
          <Animated.View
            {...props}
            style={[style, { transform: [{ scale: this.buttonScale }] }]}
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
                {children || (
                  <Fragment>
                    {!disabled && !hideBiometricIcon && (
                      <HoldToAuthorizeButtonIcon
                        animatedValue={this.longPressProgress}
                        biometryType={biometryType}
                      />
                    )}
                    <Title>{isAuthorizing ? 'Authorizing' : label}</Title>
                  </Fragment>
                )}
                {!hideInnerBorder && (
                  <InnerBorder radius={ButtonBorderRadius} />
                )}
              </Content>
            </ShadowStack>
          </Animated.View>
        </LongPressGestureHandler>
      </TapGestureHandler>
    );
  }
}

const HoldToAuthorizeButtonWithBiometrics = ({ label, ...props }) => {
  const biometryType = useBiometryType();
  const enableLongPress =
    biometryType === BiometryTypes.FaceID ||
    biometryType === BiometryTypes.none;

  return (
    <HoldToAuthorizeButton
      {...props}
      biometryType={biometryType}
      enableLongPress={enableLongPress}
      label={enableLongPress ? label : label.replace('Hold', 'Tap')}
    />
  );
};

export default React.memo(HoldToAuthorizeButtonWithBiometrics);
