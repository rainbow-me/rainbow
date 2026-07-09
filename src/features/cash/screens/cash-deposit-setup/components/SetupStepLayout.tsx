import React, { memo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text, useBackgroundColor } from '@/design-system';
import * as i18n from '@/languages';

import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';
import { SetupActionButton } from './SetupActionButton';

type SetupStepLayoutProps = {
  title: string;
  children?: ReactNode;
  /** Overrides the default "Next" CTA label. */
  actionLabel?: string;
  /** Overrides the default `next()` press handler. */
  onAction?: () => void;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  backDisabled?: boolean;
};

export const SetupStepLayout = memo(function SetupStepLayout({
  title,
  children,
  actionLabel,
  onAction,
  actionDisabled = false,
  actionLoading = false,
  backDisabled = false,
}: SetupStepLayoutProps) {
  const { next, back } = useCashDepositSetupNavigation();
  const surfaceSecondaryElevated = useBackgroundColor('surfaceSecondaryElevated');
  const insets = useSafeAreaInsets();

  return (
    <Box
      background="surfacePrimaryElevated"
      height="full"
      paddingHorizontal="24px"
      width="full"
      style={{ paddingBottom: insets.bottom + 16, paddingTop: insets.top + 24 }}
    >
      <ButtonPressAnimation disabled={backDisabled} onPress={back} scaleTo={0.8} testID="cash-setup-back">
        <Box
          alignItems="center"
          borderRadius={18}
          height={{ custom: 36 }}
          justifyContent="center"
          style={{ backgroundColor: surfaceSecondaryElevated }}
          width={{ custom: 36 }}
        >
          <Text align="center" color="label" size="17pt" weight="heavy">
            {'􀆉'}
          </Text>
        </Box>
      </ButtonPressAnimation>

      <Box paddingTop="24px">
        <Text color="label" size="26pt" weight="heavy">
          {title}
        </Text>
      </Box>

      <Box style={styles.body}>{children}</Box>

      <SetupActionButton
        disabled={actionDisabled}
        label={actionLabel ?? i18n.t(i18n.l.cash.deposit_setup.next)}
        loading={actionLoading}
        onPress={onAction ?? next}
        testID="cash-setup-next"
        textSize="20pt"
      />
    </Box>
  );
});

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
});
