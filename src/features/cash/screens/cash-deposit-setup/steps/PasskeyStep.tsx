import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';
import { useAddPasskeyFlow } from './useAddPasskeyFlow';

const l = i18n.l.cash.deposit_setup.passkey;

const KEY_ICON = '􀟖';

export const PasskeyStep = memo(function PasskeyStep() {
  const { submitting, submit } = useAddPasskeyFlow();

  return (
    <SetupStepLayout
      actionLabel={i18n.t(l.action)}
      actionLoading={submitting}
      backDisabled={submitting}
      onAction={submit}
      subtitle={i18n.t(l.subtitle)}
      title={i18n.t(l.title)}
    >
      <Box alignItems="center" height="full" justifyContent="center">
        <Text align="center" color="blue" size="44pt" style={styles.keyIcon} weight="heavy">
          {KEY_ICON}
        </Text>
      </Box>
    </SetupStepLayout>
  );
});

const styles = StyleSheet.create({
  keyIcon: {
    lineHeight: 64,
  },
});
