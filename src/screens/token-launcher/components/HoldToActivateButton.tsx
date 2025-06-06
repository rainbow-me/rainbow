import React, { PropsWithChildren, useCallback } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ShimmerAnimation } from '@/components/animations';
import { useBiometryIconString } from '@/components/buttons/BiometricButtonContent';
import HoldToAuthorizeButtonIcon from '@/components/buttons/hold-to-authorize/HoldToAuthorizeButtonIcon';
import { useTheme } from '@/theme';
import { IS_ANDROID } from '@/env';
import { Box, Text, TextProps } from '@/design-system';
import { colors } from '@/styles';
import { useWallets } from '@/hooks';
import { LedgerIcon } from '@/components/icons/svg/LedgerIcon';

const BUTTON_HEIGHT = 56;

const BUTTON_SCALE_DURATION_IN_MS = 150;
const LONG_PRESS_DURATION_IN_MS = 500;

type LabelProps = Omit<TextProps, 'children'> & {
  label: string;
  showIcon?: boolean;
  color?: string;
  testID?: string;
};

function LabelWithBiometryIcon({ label, showIcon = true, testID, color, ...textProps }: LabelProps) {
  const { isHardwareWallet } = useWallets();
  const biometryIcon = useBiometryIconString({ showIcon: !IS_ANDROID && showIcon, isHardwareWallet });
  const { colors } = useTheme();

  return (
    <>
      {/* TODO: note from Kane regarding the color of the Ledger icon potentially being off */}
      {isHardwareWallet && showIcon && <LedgerIcon color={color || colors.appleBlue} />}
      <Text
        testID={testID || label}
        weight="heavy"
        color="label"
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...textProps}
      >
        {`${biometryIcon}${label}`}
      </Text>
    </>
  );
}

function calculateReverseDurationWorklet(longPressProgress: number) {
  'worklet';
  return (longPressProgress / 100) * LONG_PRESS_DURATION_IN_MS;
}

export interface HoldToActivateButtonProps {
  backgroundColor: string;
  disabledBackgroundColor: string;
  disabled?: boolean;
  disableShimmerAnimation?: boolean;
  isProcessing: boolean;
  label: string;
  processingLabel: string;
  onLongPress: () => void;
  showBiometryIcon: boolean;
  testID: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  progressColor?: string;
  height?: number;
}

type Props = PropsWithChildren<HoldToActivateButtonProps>;

export function HoldToActivateButton({
  backgroundColor,
  disabled = false,
  disabledBackgroundColor,
  disableShimmerAnimation = false,
  label,
  processingLabel,
  showBiometryIcon,
  style,
  testID,
  isProcessing,
  onLongPress,
  height = BUTTON_HEIGHT,
  textStyle,
  progressColor,
  ...props
}: Props) {
  const longPressProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: buttonScale.value }] };
  });

  const handleLongPress = useCallback(() => {
    onLongPress?.();
  }, [onLongPress]);

  const longPress = Gesture.LongPress()
    .enabled(!disabled && !isProcessing)
    .minDuration(LONG_PRESS_DURATION_IN_MS)
    .onBegin(() => {
      buttonScale.value = withTiming(0.97, {
        duration: BUTTON_SCALE_DURATION_IN_MS,
      });
      longPressProgress.value = withTiming(100, {
        duration: LONG_PRESS_DURATION_IN_MS,
      });
    })
    .onStart(() => {
      triggerHaptics('notificationSuccess');
      // Wait for the button to animate back to scale 1 before calling the onLongPress
      buttonScale.value = withTiming(
        1,
        {
          duration: BUTTON_SCALE_DURATION_IN_MS,
        },
        () => {
          runOnJS(handleLongPress)();
        }
      );
    })
    .onFinalize(() => {
      buttonScale.value = withTiming(1, {
        duration: BUTTON_SCALE_DURATION_IN_MS,
      });
      longPressProgress.value = withTiming(0, {
        duration: calculateReverseDurationWorklet(longPressProgress.value),
      });
    });

  return (
    <GestureDetector gesture={longPress}>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Animated.View {...props} style={[style, scaleStyle]}>
        <Box
          justifyContent="center"
          alignItems="center"
          width="full"
          backgroundColor={disabled ? disabledBackgroundColor : backgroundColor}
          height={height}
          overflow="hidden"
          borderRadius={height}
          shadow={disabled ? ('12px' as const) : ('18px' as const)}
        >
          {!IS_ANDROID && !disabled && <HoldToAuthorizeButtonIcon sharedValue={longPressProgress} progressColor={progressColor} />}
          <LabelWithBiometryIcon
            label={isProcessing ? processingLabel : label}
            showIcon={showBiometryIcon && !isProcessing}
            testID={testID}
            size="20pt"
            weight="heavy"
            color={'label'}
            style={textStyle}
          />
          <ShimmerAnimation color={colors.whiteLabel} enabled={!disableShimmerAnimation && !disabled} />
        </Box>
      </Animated.View>
    </GestureDetector>
  );
}
