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
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../Spinner' was resolved to '/Users/nic... Remove this comment to see the full error message
import Spinner from '../../Spinner';
import { ShimmerAnimation } from '../../animations';
import { Centered, InnerBorder } from '../../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../BiometricButtonContent' was resolved to... Remove this comment to see the full error message
import BiometricButtonContent from '../BiometricButtonContent';
// @ts-expect-error ts-migrate(6142) FIXME: Module './HoldToAuthorizeButtonIcon' was resolved ... Remove this comment to see the full error message
import HoldToAuthorizeButtonIcon from './HoldToAuthorizeButtonIcon';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/context' or its co... Remove this comment to see the full error message
import { useTheme } from '@rainbow-me/context';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { BiometryTypes } from '@rainbow-me/helpers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useBiometryType, useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { haptics } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const { divide, multiply, proc } = Animated;

const { ACTIVE, BEGAN, END, FAILED } = State;

const ButtonHeight = 56;
const SmallButtonHeight = 46;
const TinyButtonHeight = 40;

const ButtonDisabledBgColor = (colors: any) => ({
  dark: colors.darkGrey,
  light: colors.lightGrey,
});

const ButtonShadows = (colors: any) => ({
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

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.whiteLabel,
    size: 31,
  })
)`
  left: 15;
  position: absolute;
`;

const animate = (
  value: any,
  { duration = buttonScaleDurationMs, toValue }: any
) =>
  timing(value, {
    duration,
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'EasingFunction' is not assignable to type 'E... Remove this comment to see the full error message
    easing: Easing.inOut(Easing.ease),
    toValue,
  });

const calculateReverseDuration = proc(longPressProgress =>
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Adaptable<Value> | undefined' is... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isAuthorizing' does not exist on type 'R... Remove this comment to see the full error message
    if (this.state.isAuthorizing && !this.props.isAuthorizing) {
      this.onFinishAuthorizing();
    }
  };

  buttonScale = new Value(1);

  longPressProgress = new Value(0);

  onFinishAuthorizing = () => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'disabled' does not exist on type 'Readon... Remove this comment to see the full error message
    if (!this.props.disabled) {
      animate(this.longPressProgress, {
        duration: calculateReverseDuration(this.longPressProgress),
        toValue: 0,
      }).start(() => this.setState({ isAuthorizing: false }));
    }
  };

  handlePress = () => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'onLongPress' does not exist on type 'Rea... Remove this comment to see the full error message
    if (!this.state.isAuthorizing && this.props.onLongPress) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'onLongPress' does not exist on type 'Rea... Remove this comment to see the full error message
      this.props.onLongPress();
    }
  };

  onLongPressChange = ({ nativeEvent: { state } }: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'disabled' does not exist on type 'Readon... Remove this comment to see the full error message
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

  onTapChange = ({ nativeEvent: { state } }: any) => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'disabled' does not exist on type 'Readon... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'backgroundColor' does not exist on type ... Remove this comment to see the full error message
      backgroundColor,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'colors' does not exist on type 'Readonly... Remove this comment to see the full error message
      colors,
      children,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'deviceDimensions' does not exist on type... Remove this comment to see the full error message
      deviceDimensions,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'disabled' does not exist on type 'Readon... Remove this comment to see the full error message
      disabled,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'disabledBackgroundColor' does not exist ... Remove this comment to see the full error message
      disabledBackgroundColor,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'enableLongPress' does not exist on type ... Remove this comment to see the full error message
      enableLongPress,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'hideInnerBorder' does not exist on type ... Remove this comment to see the full error message
      hideInnerBorder,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'label' does not exist on type 'Readonly<... Remove this comment to see the full error message
      label,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'parentHorizontalPadding' does not exist ... Remove this comment to see the full error message
      parentHorizontalPadding,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'shadows' does not exist on type 'Readonl... Remove this comment to see the full error message
      shadows,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'showBiometryIcon' does not exist on type... Remove this comment to see the full error message
      showBiometryIcon,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'smallButton' does not exist on type 'Rea... Remove this comment to see the full error message
      smallButton,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'style' does not exist on type 'Readonly<... Remove this comment to see the full error message
      style,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'testID' does not exist on type 'Readonly... Remove this comment to see the full error message
      testID,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'tinyButton' does not exist on type 'Read... Remove this comment to see the full error message
      tinyButton,
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'theme' does not exist on type 'Readonly<... Remove this comment to see the full error message
      theme,
      ...props
    } = this.props;

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isAuthorizing' does not exist on type 'R... Remove this comment to see the full error message
    const isAuthorizing = this.props.isAuthorizing || this.state.isAuthorizing;

    const bgColor = disabled
      ? // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        disabledBackgroundColor || ButtonDisabledBgColor(colors)[theme]
      : backgroundColor || colors.appleBlue;

    const height = tinyButton
      ? TinyButtonHeight
      : smallButton
      ? SmallButtonHeight
      : ButtonHeight;
    const width = deviceDimensions.width - parentHorizontalPadding * 2;

    return (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <TapGestureHandler onHandlerStateChange={this.onTapChange}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <LongPressGestureHandler
          // @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; enableLongPress: any; m... Remove this comment to see the full error message
          enableLongPress={enableLongPress}
          minDurationMs={longPressProgressDurationMs}
          onHandlerStateChange={this.onLongPressChange}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Animated.View
            {...props}
            style={[style, { transform: [{ scale: this.buttonScale }] }]}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Content
                backgroundColor={bgColor}
                height={height}
                smallButton={smallButton}
                tinyButton={tinyButton}
              >
                {children || (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Fragment>
                    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name
                    'android'.
                    {!android && !disabled && (
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                      <HoldToAuthorizeButtonIcon
                        animatedValue={this.longPressProgress}
                      />
                    )}
                    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name
                    'android'.
                    {android && isAuthorizing && <LoadingSpinner />}
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Label
                      label={isAuthorizing ? 'Authorizing' : label}
                      showIcon={showBiometryIcon && !isAuthorizing}
                      smallButton={smallButton}
                      testID={testID}
                      tinyButton={tinyButton}
                    />
                  </Fragment>
                )}
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <ShimmerAnimation
                  color={colors.whiteLabel}
                  enabled={!disabled}
                  width={width}
                />
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
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
}: any) => {
  const biometryType = useBiometryType();
  const { colors } = useTheme();
  const deviceDimensions = useDimensions();

  const isLongPressAvailableForBiometryType =
    biometryType === BiometryTypes.FaceID ||
    biometryType === BiometryTypes.Face ||
    biometryType === BiometryTypes.none;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
