import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_HANDLE_COLOR_DARK, DEFAULT_HANDLE_COLOR_LIGHT } from '@/components/PanelSheet/PanelSheet';
import { Box, Text, useColorMode } from '@/design-system';

import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';
import { SetupActionButton } from './SetupActionButton';
import { SetupCancelButton } from './SetupCancelButton';

type SetupSuccessStepAccessory =
  | {
      type: 'cancel';
      onPress: () => void;
    }
  | {
      type: 'handle';
    };

type SetupSuccessStepLayoutProps = {
  actionLabel: string;
  accessory: SetupSuccessStepAccessory;
  description: string;
  onAction?: () => void;
  title: string;
};

const CHECKMARK_CIRCLE = '􀁢';

export const SetupSuccessStepLayout = memo(function SetupSuccessStepLayout({
  actionLabel,
  accessory,
  description,
  onAction,
  title,
}: SetupSuccessStepLayoutProps) {
  const { next } = useCashDepositSetupNavigation();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useColorMode();
  const handleColor = isDarkMode ? DEFAULT_HANDLE_COLOR_DARK : DEFAULT_HANDLE_COLOR_LIGHT;
  const actionBottom = Math.max(insets.bottom + 2, 24);

  return (
    <Box background="surfacePrimaryElevated" height="full" width="full">
      {accessory.type === 'cancel' ? (
        <Box position="absolute" right={{ custom: 16 }} top={{ custom: insets.top + 4 }} zIndex={1}>
          <SetupCancelButton onPress={accessory.onPress} testID="cash-setup-success-cancel" />
        </Box>
      ) : (
        <Box alignItems="center" left="0px" position="absolute" right="0px" top={{ custom: insets.top + 4 }} zIndex={1}>
          <Box backgroundColor={handleColor} borderRadius={3} height={{ custom: 5 }} width={{ custom: 36 }} />
        </Box>
      )}

      <Box
        alignItems="center"
        bottom="0px"
        justifyContent="center"
        left="0px"
        paddingHorizontal={{ custom: 32 }}
        pointerEvents="box-none"
        position="absolute"
        right="0px"
        top="0px"
      >
        <Box alignItems="center" gap={24} width="full">
          <Box alignItems="center" height={{ custom: 64 }} justifyContent="center" width={{ custom: 64 }}>
            <Text align="center" color="green" size="44pt" style={styles.checkmark} weight="heavy">
              {CHECKMARK_CIRCLE}
            </Text>
          </Box>
          <Box alignItems="center" gap={20} width="full">
            <Text align="center" color="label" size="30pt" weight="heavy">
              {title}
            </Text>
            <Text align="center" color="labelQuaternary" size="17pt / 135%" weight="bold">
              {description}
            </Text>
          </Box>
        </Box>
      </Box>

      <Box bottom={{ custom: actionBottom }} left={{ custom: 20 }} position="absolute" right={{ custom: 20 }}>
        <SetupActionButton label={actionLabel} onPress={onAction ?? next} shadow testID="cash-setup-success-action" />
      </Box>
    </Box>
  );
});

const styles = StyleSheet.create({
  checkmark: {
    fontSize: 46,
    lineHeight: 64,
  },
});
