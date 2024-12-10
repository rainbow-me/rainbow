import { AccentColorProvider, Box, Inline, Text, TextShadow } from '@/design-system';
import { deviceUtils, watchingAlert } from '@/utils';
import React from 'react';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { debounce } from 'lodash';
import { useWallets } from '@/hooks';
import { enableActionsOnReadOnlyWallet } from '@/config';

const BUTTON_WIDTH = deviceUtils.dimensions.width - 52;

export function ClaimButton({
  onPress,
  disabled,
  shimmer,
  biometricIcon,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  shimmer: boolean;
  biometricIcon: boolean;
  label: string;
}) {
  const { isReadOnlyWallet } = useWallets();

  return (
    <ButtonPressAnimation
      disabled={disabled}
      style={{ width: '100%', paddingHorizontal: 18 }}
      scaleTo={0.96}
      onPress={debounce(() => {
        if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
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
          <ShimmerAnimation color="#FFFFFF" enabled={shimmer} width={BUTTON_WIDTH} />
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
