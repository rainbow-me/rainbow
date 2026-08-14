import React, { memo, useMemo } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { BivoCardInput, BivoCVCInput, BivoTextInput } from '@bivoglobal/payment-react-native';

import { Box, Text } from '@/design-system';
import visaLogo from '@/features/cash/assets/visa.png';
import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import { useSetupInputTextStyle } from '@/features/cash/components/useSetupInputTextStyle';
import { useCardLinkFlowStore } from '@/features/cash/stores/cardLinkFlowStore';
import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';
import { CARD_FIELD, useSetupContext, useSetupInputRef } from '../setupContext';
import { goBackInSetup } from '../setupNavigation';

const l = i18n.l.cash.deposit_setup.card_details;

export const CardDetailsStep = memo(function CardLinkForm() {
  const { getCardForm, onCardTypeChange, refreshCardFormReadiness } = useSetupContext();
  const state = useCardLinkFlowStore(store => store.state);
  const reset = useCardLinkFlowStore.getState().reset;
  const bivoStore = getCardForm();
  const cardNumberInputRef = useSetupInputRef();
  const setupTextStyle = useSetupInputTextStyle();
  const textStyle = useMemo(
    () => ({
      ...setupTextStyle,
      borderColor: 'transparent',
      borderWidth: 2,
      ...(Platform.OS === 'ios' ? { paddingVertical: 10 } : null),
    }),
    [setupTextStyle]
  );
  const cardNumberTextStyle = useMemo(() => ({ ...textStyle, paddingRight: 60 }), [textStyle]);
  const cancel = () => {
    reset();
    goBackInSetup();
  };

  return (
    <>
      <SetupStepLayout title={i18n.t(l.title)}>
        <Box paddingTop="24px">
          <View>
            <BivoCardInput
              bivoStore={bivoStore}
              cardIcon={false}
              fieldName={CARD_FIELD.number}
              inputRef={cardNumberInputRef}
              onCardTypeChange={onCardTypeChange}
              onStateChange={refreshCardFormReadiness}
              placeholder={i18n.t(l.card_number)}
              required
              textStyle={cardNumberTextStyle}
            />
            <View pointerEvents="none" style={styles.visaBadge}>
              <Image resizeMode="contain" source={visaLogo} style={styles.visaLogo} />
            </View>
          </View>
          <Box paddingBottom="4px" paddingLeft="4px">
            <Text color="labelSecondary" size="13pt" weight="semibold">
              {i18n.t(l.only_visa)}
            </Text>
          </Box>
          <Box flexDirection="row" gap={12}>
            <BivoTextInput
              bivoStore={bivoStore}
              containerStyle={styles.flex}
              fieldName={CARD_FIELD.expiry}
              keyboardType="number-pad"
              onStateChange={refreshCardFormReadiness}
              placeholder={i18n.t(l.expiry)}
              required
              textStyle={textStyle}
            />
            <BivoCVCInput
              bivoStore={bivoStore}
              containerStyle={styles.flex}
              fieldName={CARD_FIELD.cvc}
              onStateChange={refreshCardFormReadiness}
              placeholder={i18n.t(l.cvc)}
              required
              textStyle={textStyle}
            />
          </Box>
          <BivoTextInput
            bivoStore={bivoStore}
            fieldName={CARD_FIELD.zip}
            keyboardType="number-pad"
            onStateChange={refreshCardFormReadiness}
            placeholder={i18n.t(l.zip)}
            required
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  visaBadge: {
    alignItems: 'center',
    backgroundColor: '#1B33C3',
    borderRadius: 6,
    height: 20,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'absolute',
    right: 16,
    top: 21,
    width: 28,
  },
  visaLogo: {
    height: 6,
    width: 19,
  },
});
