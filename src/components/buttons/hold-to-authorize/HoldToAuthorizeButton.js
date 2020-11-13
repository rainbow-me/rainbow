import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { ActivityIndicator, Dimensions, Keyboard } from 'react-native';
import {
  LongPressGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, { Easing, timing, Value } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import BiometryTypes from '../../../helpers/biometryTypes';
import { useBiometryType } from '../../../hooks';
import { haptics } from '../../../utils';
import Spinner from '../../Spinner';
import { Centered, InnerBorder } from '../../layout';
import { Text } from '../../text';
import HoldToAuthorizeButtonIcon from './HoldToAuthorizeButtonIcon';
import { colors, padding } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const { divide, multiply, proc } = Animated;

const { ACTIVE, BEGAN, END, FAILED } = State;

const ButtonBorderRadius = 30;
const ButtonHeight = 59;
const SmallButtonHeight = 46;

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
  ${({ smallButton }) => !smallButton && padding(15)};
  border-radius: ${ButtonBorderRadius};
  flex-grow: 0;
  height: ${({ smallButton }) =>
    smallButton ? SmallButtonHeight : ButtonHeight};
  overflow: hidden;
  width: 100%;
`;

const Title = styled(Text).attrs(({ smallButton }) => ({
  color: 'white',
  size: smallButton ? 'large' : 'larger',
  weight: 'bold',
}))`
  margin-bottom: 4;
`;

const animate = (value, { duration = buttonScaleDurationMs, toValue }) =>
  timing(value, {
    duration,
    easing: Easing.inOut(Easing.ease),
    toValue,
  });

const calculateReverseDuration = proc(longPressProgress =>
  multiply(divide(longPressProgress, 100), longPressProgressDurationMs)
);

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs({
  color: colors.white,
  size: 31,
})`
  left: 15;
  position: absolute;
`;

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
    smallButton: PropTypes.bool,
    style: PropTypes.object,
    testID: PropTypes.string,
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
    if (!this.state.isAuthorizing && this.props.onLongPress) {
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
      smallButton,
      style,
      testID,
      theme,
      ...props
    } = this.props;

    const { isAuthorizing } = this.state;
    const androidWidth = Dimensions.get('window').width - 30;

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
            testID={testID}
          >
            <ShadowStack
              backgroundColor={bgColor}
              borderRadius={ButtonBorderRadius}
              height={smallButton ? SmallButtonHeight : ButtonHeight}
              shadows={
                shadows || ButtonShadows[disabled ? 'disabled' : 'default']
              }
              width={ios ? '100%' : androidWidth}
            >
              <Content backgroundColor={bgColor} smallButton={smallButton}>
                {children || (
                  <Fragment>
                    {!android && !disabled && !hideBiometricIcon && (
                      <HoldToAuthorizeButtonIcon
                        animatedValue={this.longPressProgress}
                        biometryType={biometryType}
                      />
                    )}
                    {android && (isAuthorizing || this.props.isAuthorizing) && (
                      <LoadingSpinner />
                    )}
                    <Title smallButton={smallButton}>
                      {isAuthorizing || this.props.isAuthorizing
                        ? 'Authorizing'
                        : label}
                    </Title>
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

const HoldToAuthorizeButtonWithBiometrics = ({ label, testID, ...props }) => {
  const biometryType = useBiometryType();
  const enableLongPress =
    biometryType === BiometryTypes.FaceID ||
    biometryType === BiometryTypes.Face ||
    biometryType === BiometryTypes.none;
  return (
    <HoldToAuthorizeButton
      {...props}
      biometryType={biometryType}
      enableLongPress={enableLongPress}
      label={enableLongPress ? label : label.replace('Hold', 'Tap')}
      testID={testID}
    />
  );
};

export default React.memo(HoldToAuthorizeButtonWithBiometrics);
