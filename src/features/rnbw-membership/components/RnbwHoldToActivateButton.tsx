import React, { memo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import chroma from 'chroma-js';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBiometryIconString } from '@/components/buttons/BiometricButtonContent';
import { GestureHandlerButton } from '@/components/buttons/GestureHandlerButton';
import { HoldToActivateProgress } from '@/components/buttons/HoldToActivateProgress';
import { useHoldToActivate } from '@/components/buttons/useHoldToActivate';
import { LedgerIcon } from '@/components/icons/svg/LedgerIcon';
import { type TextProps } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { LoadingSpinner } from '@/framework/ui/components/LoadingSpinner';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { time } from '@/utils/time';

import { RNBW_BUTTON_CONFIG, RnbwButtonSurface, RnbwButtonText } from './RnbwButtonSurface';

const LAYOUT_ANIMATION_CONFIG = SPRING_CONFIGS.snappierSpringConfig;
const LAYOUT_ANIMATION = LinearTransition.springify()
  .mass(LAYOUT_ANIMATION_CONFIG.mass)
  .damping(LAYOUT_ANIMATION_CONFIG.damping)
  .stiffness(LAYOUT_ANIMATION_CONFIG.stiffness);

const SPINNER_ENTER = FadeIn.delay(time.ms(400)).duration(time.ms(150));
const SPINNER_EXIT = FadeOut.duration(time.ms(150));

type RnbwHoldToActivateButtonProps = {
  variant?: 'primary' | 'secondary';
  label: string;
  processingLabel: string;
  onActivate: () => void;
  isProcessing: boolean;
  disabled?: boolean;
  showBiometryIcon?: boolean;
  height?: number;
  size?: TextProps['size'];
  weight?: TextProps['weight'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const RnbwHoldToActivateButton = memo(function RnbwHoldToActivateButton({
  variant = 'primary',
  label,
  processingLabel,
  onActivate,
  isProcessing,
  disabled = false,
  showBiometryIcon = true,
  height = 48,
  size = '20pt',
  weight = 'heavy',
  style,
  testID,
}: RnbwHoldToActivateButtonProps) {
  const isHardwareWallet = useWalletsStore(state => state.getIsHardwareWallet());
  const biometryIcon = useBiometryIconString({ showIcon: !IS_ANDROID && showBiometryIcon && !isProcessing, isHardwareWallet });

  const { holdProgress, gestureHandlerProps } = useHoldToActivate({
    onActivate,
    disabled: disabled || isProcessing,
  });

  const displayLabel = isProcessing ? processingLabel : `${biometryIcon} ${label}`;

  const midpointBackgroundColor = chroma.mix(RNBW_BUTTON_CONFIG.primary.colors[0], RNBW_BUTTON_CONFIG.primary.colors[1], 0.5, 'lab').css();
  const midpointTextColor = chroma
    .mix(RNBW_BUTTON_CONFIG.primary.text.colors[0], RNBW_BUTTON_CONFIG.primary.text.colors[1], 0.5, 'lab')
    .css();

  return (
    <GestureHandlerButton
      scaleTo={0.96}
      testID={testID}
      style={style}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...gestureHandlerProps}
    >
      <RnbwButtonSurface variant={variant} height={height}>
        <HoldToActivateProgress holdProgress={holdProgress} color={midpointBackgroundColor} />
        {isProcessing && (
          <Animated.View entering={SPINNER_ENTER} exiting={SPINNER_EXIT} style={styles.spinnerContainer}>
            <LoadingSpinner color={midpointTextColor} />
          </Animated.View>
        )}
        <Animated.View layout={LAYOUT_ANIMATION} style={styles.labelContainer}>
          {isHardwareWallet && showBiometryIcon && !isProcessing && <LedgerIcon color={RNBW_BUTTON_CONFIG.primary.text.colors[0]} />}
          <RnbwButtonText variant={variant} size={size} weight={weight}>
            {displayLabel}
          </RnbwButtonText>
        </Animated.View>
      </RnbwButtonSurface>
    </GestureHandlerButton>
  );
});

const styles = StyleSheet.create({
  spinnerContainer: {
    position: 'absolute',
    left: 18,
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
