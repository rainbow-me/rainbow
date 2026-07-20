import React, { memo, useEffect } from 'react';

import { BivoCardInput, BivoCVCInput, BivoTextInput } from '@bivoglobal/payment-react-native';

import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';
import { useSetupInputTextStyle } from '../components/useSetupInputTextStyle';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';
import { CARD_FIELD, useCardLinkFlow } from './useCardLinkFlow';

const l = i18n.l.cash.deposit_setup.card_details;

export const CardDetailsStep = memo(function CardLinkForm() {
  const { state, bivoStore, isReady, onFieldStateChange, submit, retry } = useCardLinkFlow();
  const { next } = useCashDepositSetupNavigation();
  const textStyle = useSetupInputTextStyle();

  useEffect(() => {
    if (state === 'success') {
      next();
    }
  }, [next, state]);

  if (state === 'submitError') {
    return (
      <SetupStepLayout actionLabel={i18n.t(l.try_again)} onAction={retry} title={i18n.t(l.title)}>
        <Box paddingTop="24px">
          <Text color="red" size="17pt" weight="semibold">
            {i18n.t(l.submit_error)}
          </Text>
        </Box>
      </SetupStepLayout>
    );
  }

  const submitting = state === 'submitting';

  return (
    <SetupStepLayout
      actionDisabled={!isReady}
      actionLoading={submitting}
      backDisabled={submitting}
      onAction={submit}
      title={i18n.t(l.title)}
    >
      <Box paddingTop="24px">
        <BivoCardInput
          bivoStore={bivoStore}
          fieldName={CARD_FIELD.number}
          onStateChange={onFieldStateChange}
          placeholder={i18n.t(l.card_number)}
          textStyle={textStyle}
        />
        <Box flexDirection="row" gap={12}>
          <BivoTextInput
            bivoStore={bivoStore}
            containerStyle={{ flex: 1 }}
            fieldName={CARD_FIELD.expiry}
            onStateChange={onFieldStateChange}
            placeholder={i18n.t(l.expiry)}
            textStyle={textStyle}
          />
          <BivoCVCInput
            bivoStore={bivoStore}
            containerStyle={{ flex: 1 }}
            fieldName={CARD_FIELD.cvc}
            onStateChange={onFieldStateChange}
            placeholder={i18n.t(l.cvc)}
            textStyle={textStyle}
          />
        </Box>
        <BivoTextInput
          bivoStore={bivoStore}
          fieldName={CARD_FIELD.zip}
          onStateChange={onFieldStateChange}
          placeholder={i18n.t(l.zip)}
          textStyle={textStyle}
        />
      </Box>
    </SetupStepLayout>
  );
});
