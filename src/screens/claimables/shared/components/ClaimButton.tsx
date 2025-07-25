import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { AccentColorProvider, Box, Inline, Text, TextShadow } from '@/design-system';
import { HoldToActivateButton } from '@/screens/token-launcher/components/HoldToActivateButton';
import { getIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { deviceUtils, watchingAlert } from '@/utils';
import { debounce } from 'lodash';
import React from 'react';

const BUTTON_WIDTH = deviceUtils.dimensions.width - 52;

export function ClaimButton({
  onPress,
  enableHoldToPress,
  disabled,
  isLoading,
  shimmer,
  biometricIcon,
  label,
}: {
  onPress: () => void;
  enableHoldToPress: boolean;
  disabled: boolean;
  isLoading: boolean;
  shimmer: boolean;
  biometricIcon: boolean;
  label: string;
}) {
  if (enableHoldToPress) {
    return (
      <HoldToActivateButton
        backgroundColor={`rgba(41,90,247,1)`}
        disabledBackgroundColor={`rgba(41,90,247,0.2)`}
        disabled={disabled}
        isProcessing={isLoading}
        label={label}
        onLongPress={onPress}
        height={48}
        style={{ width: '100%', paddingHorizontal: 18 }}
        showBiometryIcon={biometricIcon}
        testID="claim-button"
        processingLabel={label}
      />
    );
  }

  return (
    <ButtonPressAnimation
      disabled={disabled}
      style={{ width: '100%', paddingHorizontal: 18 }}
      scaleTo={0.96}
      onPress={debounce(() => {
        if (!getIsReadOnlyWallet() || enableActionsOnReadOnlyWallet) {
          onPress();
        } else {
          watchingAlert();
        }
      }, 300)}
    >
      <AccentColorProvider color={`rgba(41, 90, 247, ${disabled ? 0.2 : 1})`}>
        <Box
          background="accent"
          shadow="30px accent"
          borderRadius={43}
          height={{ custom: 48 }}
          width={{ custom: BUTTON_WIDTH }}
          alignItems="center"
          justifyContent="center"
        >
          <ShimmerAnimation color="#FFFFFF" enabled={shimmer} />
          <Inline alignVertical="center" space="6px">
            {biometricIcon && (
              <TextShadow shadowOpacity={disabled ? 0 : 0.3}>
                <Text align="center" color="label" size="icon 20px" weight="heavy">
                  􀎽
                </Text>
              </TextShadow>
            )}
            <TextShadow shadowOpacity={disabled ? 0 : 0.3}>
              <Text align="center" color="label" size="20pt" weight="heavy">
                {label}
              </Text>
            </TextShadow>
          </Inline>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}
