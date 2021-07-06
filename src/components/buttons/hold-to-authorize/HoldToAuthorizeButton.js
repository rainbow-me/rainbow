import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { ActivityIndicator, Keyboard } from 'react-native';
import {
  LongPressGestureHandler,
  State,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, { Easing, timing, Value } from 'react-native-reanimated';
import styled from 'styled-components';
import Spinner from '../../Spinner';
import { ShimmerAnimation } from '../../animations';
import { Centered, InnerBorder } from '../../layout';
import BiometricButtonContent from '../BiometricButtonContent';
import HoldToAuthorizeButtonIcon from './HoldToAuthorizeButtonIcon';
import { useTheme } from '@rainbow-me/context';
import { BiometryTypes } from '@rainbow-me/helpers';
import { useBiometryType, useDimensions } from '@rainbow-me/hooks';
import { padding, position } from '@rainbow-me/styles';
import { haptics } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

const { divide, multiply, proc } = Animated;

const { ACTIVE, BEGAN, END, FAILED } = State;

const ButtonHeight = 56;
const SmallButtonHeight = 46;
const TinyButtonHeight = 40;

const ButtonDisabledBgColor = colors => ({
  dark: colors.darkGrey,
  light: colors.lightGrey,
});

const ButtonShadows = colors => ({
  default: [
    [0, 3, 5, colors.shadow, 0.2],
    [0, 6, 10, colors.shadow, 0.14],
    [0, 1, 18, colors.shadow, 0.12],
  ],
  disabled: [
    [0, 2, 6, colors.shadow, 0.06],
    [0, 3, 9, colors.shadow, 0.08],
  ],
});

const buttonScaleDurationMs = 150;
const longPressProgressDurationMs = 500; // 👸 christian approves

const Content = styled(Centered).attrs({
  grow: 0,
})`
  ${position.cover};
  ${({ smallButton, tinyButton }) =>
    padding(smallButton || tinyButton ? 0 : 15)};
  border-radius: ${({ height }) => height};
  height: ${({ height }) => height};
  overflow: hidden;
  width: 100%;
`;

const Label = styled(BiometricButtonContent).attrs(
  ({ smallButton, theme: { colors }, tinyButton }) => ({
    color: colors.whiteLabel,
    size: smallButton || tinyButton ? 'large' : 'larger',
    weight: 'heavy',
  })
)`
  bottom: 2;
`;

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.whiteLabel,
    size: 31,
  })
)`
  left: 15;
  position: absolute;
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

class HoldToAuthorizeButton extends PureComponent {
  static propTypes = {
    backgroundColor: PropTypes.string,
    children: PropTypes.any,
    deviceDimensions: PropTypes.object,
    disabled: PropTypes.bool,
    disabledBackgroundColor: PropTypes.string,
    hideInnerBorder: PropTypes.bool,
    isAuthorizing: PropTypes.bool,
    label: PropTypes.string,
    onLongPress: PropTypes.func.isRequired,
    parentHorizontalPadding: PropTypes.number,
    shadows: PropTypes.arrayOf(PropTypes.array),
    showBiometryIcon: PropTypes.bool,
    smallButton: PropTypes.bool,
    style: PropTypes.object,
    testID: PropTypes.string,
    theme: PropTypes.oneOf(['light', 'dark']),
  };

  static defaultProps = {
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
      colors,
      children,
      deviceDimensions,
      disabled,
      disabledBackgroundColor,
      enableLongPress,
      hideInnerBorder,
      label,
      parentHorizontalPadding,
      shadows,
      showBiometryIcon,
      smallButton,
      style,
      testID,
      tinyButton,
      theme,
      ...props
    } = this.props;

    const isAuthorizing = this.props.isAuthorizing || this.state.isAuthorizing;

    const bgColor = disabled
      ? disabledBackgroundColor || ButtonDisabledBgColor(colors)[theme]
      : backgroundColor || colors.appleBlue;

    const height = tinyButton
      ? TinyButtonHeight
      : smallButton
      ? SmallButtonHeight
      : ButtonHeight;
    const width = deviceDimensions.width - parentHorizontalPadding * 2;

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
              borderRadius={height}
              height={height}
              shadows={
                shadows ||
                ButtonShadows(colors)[disabled ? 'disabled' : 'default']
              }
              width={width}
            >
              <Content
                backgroundColor={bgColor}
                height={height}
                smallButton={smallButton}
                tinyButton={tinyButton}
              >
                {children || (
                  <Fragment>
                    {!android && !disabled && (
                      <HoldToAuthorizeButtonIcon
                        animatedValue={this.longPressProgress}
                      />
                    )}
                    {android && isAuthorizing && <LoadingSpinner />}
                    <Label
                      label={isAuthorizing ? 'Authorizing' : label}
                      showIcon={showBiometryIcon && !isAuthorizing}
                      smallButton={smallButton}
                      testID={testID}
                      tinyButton={tinyButton}
                    />
                  </Fragment>
                )}
                <ShimmerAnimation
                  color={colors.whiteLabel}
                  enabled={!disabled}
                  width={width}
                />
                {!hideInnerBorder && <InnerBorder radius={height} />}
              </Content>
            </ShadowStack>
          </Animated.View>
        </LongPressGestureHandler>
      </TapGestureHandler>
    );
  }
}

const HoldToAuthorizeButtonWithBiometrics = ({
  disableLongPress,
  label,
  ...props
}) => {
  const biometryType = useBiometryType();
  const { colors } = useTheme();
  const deviceDimensions = useDimensions();

  const isLongPressAvailableForBiometryType =
    biometryType === BiometryTypes.FaceID ||
    biometryType === BiometryTypes.Face ||
    biometryType === BiometryTypes.none;

  return (
    <HoldToAuthorizeButton
      {...props}
      colors={colors}
      deviceDimensions={deviceDimensions}
      enableLongPress={!disableLongPress && isLongPressAvailableForBiometryType}
      label={
        isLongPressAvailableForBiometryType
          ? label
          : label.replace('Hold', 'Tap')
      }
    />
  );
};

export default React.memo(HoldToAuthorizeButtonWithBiometrics);
