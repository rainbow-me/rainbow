import React, { memo, useCallback, useEffect } from 'react';
import { Keyboard } from 'react-native';

import { BivoCardInput, BivoCVCInput, BivoTextInput } from '@bivoglobal/payment-react-native';

import { Box } from '@/design-system';
import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import { useSetupInputTextStyle } from '@/features/cash/components/useSetupInputTextStyle';
import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';
import { CARD_FIELD, useCardLinkFlow } from './useCardLinkFlow';

const l = i18n.l.cash.deposit_setup.card_details;

export const CardDetailsStep = memo(function CardLinkForm() {
  const { state, bivoStore, isReady, onFieldStateChange, reset, submit } = useCardLinkFlow();
  const { next, back } = useCashDepositSetupNavigation();
  const textStyle = useSetupInputTextStyle();

  useEffect(() => {
    if (state === 'success') {
      next();
    }
  }, [next, state]);

  const submitting = state === 'submitting';
  const cancel = useCallback(() => {
    reset();
    back();
  }, [back, reset]);

  // The number pads have no Done key, so an open keyboard would cover the status sheet with no way to close it.
  const onSubmit = useCallback(() => {
    Keyboard.dismiss();
    submit();
  }, [submit]);

  return (
    <>
      <SetupStepLayout actionDisabled={!isReady} backDisabled={submitting} onAction={onSubmit} title={i18n.t(l.title)}>
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

      {state === 'submitting' ? (
        <CashStatusHalfSheet
          description={i18n.t(l.adding_description)}
          status="inProgress"
          testID="cash-setup-card-adding"
          title={i18n.t(l.adding_title)}
        />
      ) : state === 'submitError' ? (
        <CashStatusHalfSheet
          description={i18n.t(l.error_description)}
          primaryAction={{ label: i18n.t(l.edit_details), onPress: reset, testID: 'cash-setup-card-error-edit' }}
          secondaryAction={{ label: i18n.t(i18n.l.button.cancel), onPress: cancel, testID: 'cash-setup-card-error-cancel' }}
          status="error"
          testID="cash-setup-card-error"
          title={i18n.t(l.error_title)}
        />
      ) : null}
    </>
  );
});
