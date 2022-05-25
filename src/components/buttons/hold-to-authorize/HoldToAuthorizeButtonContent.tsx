import lang from 'i18n-js';
import React, {
  Fragment,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, Keyboard } from 'react-native';
import {
  State as GestureHandlerState,
  HandlerStateChangeEvent,
  LongPressGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Spinner from '../../Spinner';
import { ShimmerAnimation } from '../../animations';
import { Centered, InnerBorder } from '../../layout';
import BiometricButtonContent from '../BiometricButtonContent';
import HoldToAuthorizeButtonIcon from './HoldToAuthorizeButtonIcon';
import {
  BUTTON_HEIGHT,
  BUTTON_SCALE_DURATION_IN_MS,
  LONG_PRESS_DURATION_IN_MS,
  SMALL_BUTTON_HEIGHT,
  TINY_BUTTON_HEIGHT,
} from './constants';
import {
  getButtonDisabledBgColor,
  getButtonShadows,
} from './helpers/buttonStyleValues';
import { HoldToAuthorizeBaseProps } from './types/HoldToAuthorizeBaseProps';
import { ThemeContextProps } from '@rainbow-me/context';
import styled from '@rainbow-me/styled-components';
import { padding, position } from '@rainbow-me/styles';
import { haptics } from '@rainbow-me/utils';
import ShadowStack from 'react-native-shadow-stack';

const { ACTIVE, BEGAN, END, FAILED } = GestureHandlerState;

interface ButtonOptionParams {
  smallButton?: boolean;
  tinyButton?: boolean;
}

interface ContentProps extends ButtonOptionParams {
  height: number;
}

const Content = styled(Centered).attrs({
  grow: 0,
})(({ smallButton, height, tinyButton }: ContentProps) => ({
  ...position.coverAsObject,
  borderRadius: height,
  height: height,
  overflow: 'hidden',
  width: '100%',
  ...padding.object(smallButton || tinyButton ? 0 : 15),
}));

interface LabelProps extends ButtonOptionParams {
  theme: ThemeContextProps;
}

const Label = styled(BiometricButtonContent).attrs(
  ({ smallButton, theme: { colors }, tinyButton }: LabelProps) => ({
    color: colors.whiteLabel,
    size: smallButton || tinyButton ? 'large' : 'larger',
    weight: 'heavy',
  })
)({
  bottom: 2,
});

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }: { theme: ThemeContextProps }) => ({
    color: colors.whiteLabel,
    size: 31,
  })
)({
  left: 15,
  position: 'absolute',
});

const calculateReverseDuration = (longPressProgress: number) =>
  (longPressProgress / 100) * LONG_PRESS_DURATION_IN_MS;

type Props = PropsWithChildren<HoldToAuthorizeBaseProps>;

function HoldToAuthorizeButtonContent2({
  backgroundColor,
  colors,
  children,
  deviceDimensions,
  disabled = false,
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
  isAuthorizing: isAuthorizingProp,
  theme = 'light',
  onLongPress,
  ...props
}: Props) {
  const [isAuthorizingState, setIsAuthorizing] = useState(false);

  const longPressProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: buttonScale.value }] };
  });

  const onFinishAuthorizing = useCallback(() => {
    if (!disabled) {
      longPressProgress.value = withTiming(
        0,
        {
          duration: calculateReverseDuration(longPressProgress.value),
        },
        () => setIsAuthorizing(false)
      );
    }
  }, [disabled, longPressProgress]);

  useEffect(() => {
    if (isAuthorizingState && !isAuthorizingProp) {
      onFinishAuthorizing();
    }
  }, [isAuthorizingState, isAuthorizingProp, onFinishAuthorizing]);

  const isAuthorizing = isAuthorizingProp || isAuthorizingState;

  const bgColor = disabled
    ? disabledBackgroundColor ?? getButtonDisabledBgColor(colors)[theme]
    : backgroundColor ?? colors.appleBlue;

  const height = tinyButton
    ? TINY_BUTTON_HEIGHT
    : smallButton
    ? SMALL_BUTTON_HEIGHT
    : BUTTON_HEIGHT;

  const width = deviceDimensions.width - parentHorizontalPadding * 2;

  const handlePress = () => {
    if (!isAuthorizingState && onLongPress) {
      onLongPress();
    }
  };

  const onLongPressChange = ({
    nativeEvent: { state },
  }: HandlerStateChangeEvent) => {
    if (state === ACTIVE && !disabled) {
      haptics.notificationSuccess();
      Keyboard.dismiss();

      buttonScale.value = withTiming(
        1,
        { duration: BUTTON_SCALE_DURATION_IN_MS },
        () => setIsAuthorizing(true)
      );

      handlePress();
    }
  };

  const onTapChange = ({ nativeEvent: { state } }: HandlerStateChangeEvent) => {
    if (disabled) {
      if (state === END) {
        haptics.notificationWarning();
        buttonScale.value = withTiming(
          1.02,
          {
            duration: BUTTON_SCALE_DURATION_IN_MS,
          },
          () => {
            buttonScale.value = withTiming(1, {
              duration: BUTTON_SCALE_DURATION_IN_MS,
            });
          }
        );
      }
    } else {
      if (state === ACTIVE) {
        if (!enableLongPress) {
          handlePress();
        }
      } else if (state === BEGAN) {
        buttonScale.value = withTiming(0.97, {
          duration: BUTTON_SCALE_DURATION_IN_MS,
        });
        if (enableLongPress) {
          longPressProgress.value = withTiming(100, {
            duration: LONG_PRESS_DURATION_IN_MS,
          });
        }
      } else if (state === END || state === FAILED) {
        buttonScale.value = withTiming(1, {
          duration: BUTTON_SCALE_DURATION_IN_MS,
        });
        if (enableLongPress) {
          longPressProgress.value = withTiming(0, {
            duration: calculateReverseDuration(longPressProgress.value),
          });
        }
      }
    }
  };

  return (
    <TapGestureHandler onHandlerStateChange={onTapChange}>
      <LongPressGestureHandler
        enabled={enableLongPress}
        minDurationMs={LONG_PRESS_DURATION_IN_MS}
        onHandlerStateChange={onLongPressChange}
      >
        <Animated.View {...props} style={[style, scaleStyle]}>
          {/* Ignoring due to obscure JS error from ShadowStack */}
          {/* @ts-ignore */}
          <ShadowStack
            backgroundColor={bgColor}
            borderRadius={height}
            height={height}
            shadows={
              shadows ??
              getButtonShadows(colors)[disabled ? 'disabled' : 'default']
            }
            width={width}
          >
            <Content
              backgroundColor={bgColor}
              height={height}
              smallButton={smallButton}
              tinyButton={tinyButton}
            >
              {children ?? (
                <Fragment>
                  {!android && !disabled && (
                    <HoldToAuthorizeButtonIcon
                      sharedValue={longPressProgress}
                    />
                  )}
                  {android && isAuthorizing && <LoadingSpinner />}
                  <Label
                    label={
                      isAuthorizing
                        ? lang.t('button.hold_to_authorize.authorizing')
                        : label
                    }
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

export default HoldToAuthorizeButtonContent2;
