import React, { memo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Box, Text, useBackgroundColor } from '@/design-system';

import { CashActionButton } from './CashActionButton';

export type CashStepLayoutProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  actionLabel: string;
  actionTestID: string;
  backTestID: string;
  onAction: () => void;
  /** Omit to hide the back button. */
  onBack?: () => void;
  headerRight?: ReactNode;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  backDisabled?: boolean;
};

export const CashStepLayout = memo(function CashStepLayout({
  title,
  subtitle,
  children,
  actionLabel,
  actionTestID,
  backTestID,
  onAction,
  onBack,
  headerRight,
  actionDisabled = false,
  actionLoading = false,
  backDisabled = false,
}: CashStepLayoutProps) {
  const surfacePrimaryElevated = useBackgroundColor('surfacePrimaryElevated');
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior="padding"
      // Closed keyboard: the button sits insets.bottom above the screen bottom; open: 20 above the keyboard.
      keyboardVerticalOffset={20 - insets.bottom}
      style={[styles.keyboardAvoidingView, { backgroundColor: surfacePrimaryElevated }]}
    >
      <Box
        background="surfacePrimaryElevated"
        height="full"
        paddingHorizontal="24px"
        width="full"
        style={{ paddingBottom: insets.bottom, paddingTop: insets.top + 24 }}
      >
        <Box alignItems="center" flexDirection="row" height={{ custom: 36 }} justifyContent="space-between">
          {onBack ? (
            <ButtonPressAnimation disabled={backDisabled} onPress={onBack} scaleTo={0.8} testID={backTestID}>
              <Box
                alignItems="center"
                background="fillTertiary"
                borderRadius={18}
                height={{ custom: 36 }}
                justifyContent="center"
                width={{ custom: 36 }}
              >
                <Text align="center" color="label" size="17pt" weight="heavy">
                  {'􀆉'}
                </Text>
              </Box>
            </ButtonPressAnimation>
          ) : (
            <Box />
          )}
          {headerRight}
        </Box>

        <Box gap={24} paddingTop="24px">
          <Text color="label" size="26pt" weight="heavy">
            {title}
          </Text>
          {subtitle == null ? null : (
            <Text color="labelSecondary" size="17pt / 135%" weight="bold">
              {subtitle}
            </Text>
          )}
        </Box>

        <Box style={styles.body}>{children}</Box>

        <CashActionButton
          disabled={actionDisabled}
          label={actionLabel}
          loading={actionLoading}
          onPress={onAction}
          testID={actionTestID}
          textSize="20pt"
        />
      </Box>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
});
