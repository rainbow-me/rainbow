import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, Text } from '@/design-system';
import { CashActionButton } from '@/features/cash/components/CashActionButton';
import * as i18n from '@/languages';

import { reauthenticateCashGate } from '../../services/cashAuthGateService';
import type { CashAuthIntent, OpenCashAuthGateStatus } from '../../stores/cashAuthGateStore';

const l = i18n.l.cash.add_cash_screen;

const KEY_ICON = '􀟖';

type GatePrompt = { action: string; description: string; title: string };

const PROMPT_BY_INTENT: Record<CashAuthIntent['kind'], Record<OpenCashAuthGateStatus['step'], GatePrompt>> = {
  loadCards: {
    authRequired: { action: l.reauth_continue, description: l.reauth_description, title: l.reauth_title },
    error: { action: l.reauth_try_again, description: l.reauth_error_description, title: l.reauth_error_title },
  },
};

const TEST_ID_BY_STEP: Record<OpenCashAuthGateStatus['step'], string> = {
  authRequired: 'cash-reauth-continue',
  error: 'cash-reauth-try-again',
};

export function ReauthenticateContent({ status }: { status: OpenCashAuthGateStatus }) {
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = useCallback(async () => {
    setSubmitting(true);
    try {
      await reauthenticateCashGate();
    } finally {
      setSubmitting(false);
    }
  }, []);

  const prompt = PROMPT_BY_INTENT[status.intent.kind][status.step];
  return (
    <Box as={Animated.View} entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)}>
      <Box gap={48} paddingHorizontal="32px" paddingTop={{ custom: 52 }}>
        <Text color="blue" size="44pt" style={styles.keyIcon} weight="heavy">
          {KEY_ICON}
        </Text>
        <Box gap={24}>
          <Text color="label" size="26pt" weight="heavy">
            {i18n.t(prompt.title)}
          </Text>
          <Text color="labelQuaternary" size="17pt" weight="bold">
            {i18n.t(prompt.description)}
          </Text>
        </Box>
      </Box>
      <Box paddingBottom="16px" paddingHorizontal="20px" paddingTop="44px">
        <CashActionButton
          label={i18n.t(prompt.action)}
          loading={submitting}
          onPress={handleContinue}
          testID={TEST_ID_BY_STEP[status.step]}
        />
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  keyIcon: {
    lineHeight: 64,
  },
});
