import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { BivoCardInput, BivoCVCInput, BivoTextInput } from '@bivoglobal/payment-react-native';

import { Box, Text, useForegroundColor } from '@/design-system';
import visaLogo from '@/features/cash/assets/visa.png';
import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import { useSetupInputTextStyle } from '@/features/cash/components/useSetupInputTextStyle';
import { CardBrand } from '@/features/cash/services/rampClient';
import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';
import { CARD_FIELD, useCardLinkFlow } from './useCardLinkFlow';

const l = i18n.l.cash.deposit_setup.card_details;

export const CardDetailsStep = memo(function CardLinkForm() {
  const {
    state,
    bivoStore,
    cardBrand,
    fieldErrors,
    isReady,
    showOnlyVisaError,
    onCardTypeChange,
    onFieldBlur,
    onFieldFocus,
    onFieldStateChange,
    reset,
    submit,
  } = useCardLinkFlow();
  const { next, back } = useCashDepositSetupNavigation();
  const setupTextStyle = useSetupInputTextStyle();
  const red = useForegroundColor('red');

  // The border stays mounted (transparent) so toggling it never changes field
  // geometry; iOS padding shrinks by the border width to keep the height intact.
  const textStyle = useMemo(
    () => ({
      ...setupTextStyle,
      borderColor: 'transparent',
      borderWidth: 2,
      ...(Platform.OS === 'ios' ? { paddingVertical: 10 } : null),
    }),
    [setupTextStyle]
  );
  const errorTextStyle = useMemo(() => ({ ...textStyle, borderColor: red }), [red, textStyle]);

  useEffect(() => {
    if (state === 'success') {
      next();
    }
  }, [next, state]);

  const cancel = useCallback(() => {
    reset();
    back();
  }, [back, reset]);

  return (
    <>
      <SetupStepLayout actionDisabled={!isReady} onAction={submit} title={i18n.t(l.title)}>
        <Box paddingTop="24px">
          <View>
            <BivoCardInput
              bivoStore={bivoStore}
              cardIcon={false}
              defaultError={false}
              fieldName={CARD_FIELD.number}
              onBlur={() => onFieldBlur(CARD_FIELD.number)}
              onCardTypeChange={onCardTypeChange}
              onFocus={() => onFieldFocus(CARD_FIELD.number)}
              onStateChange={onFieldStateChange}
              placeholder={i18n.t(l.card_number)}
              required
              textStyle={{ ...(fieldErrors[CARD_FIELD.number] ? errorTextStyle : textStyle), paddingRight: 60 }}
            />
            {cardBrand === CardBrand.Visa && (
              <View pointerEvents="none" style={styles.visaBadge}>
                <Image resizeMode="contain" source={visaLogo} style={styles.visaLogo} />
              </View>
            )}
          </View>
          <Box flexDirection="row" gap={12}>
            <BivoTextInput
              bivoStore={bivoStore}
              containerStyle={{ flex: 1 }}
              defaultError={false}
              fieldName={CARD_FIELD.expiry}
              keyboardType="number-pad"
              onBlur={() => onFieldBlur(CARD_FIELD.expiry)}
              onFocus={() => onFieldFocus(CARD_FIELD.expiry)}
              onStateChange={onFieldStateChange}
              placeholder={i18n.t(l.expiry)}
              required
              textStyle={fieldErrors[CARD_FIELD.expiry] ? errorTextStyle : textStyle}
            />
            <BivoCVCInput
              bivoStore={bivoStore}
              containerStyle={{ flex: 1 }}
              defaultError={false}
              fieldName={CARD_FIELD.cvc}
              onBlur={() => onFieldBlur(CARD_FIELD.cvc)}
              onFocus={() => onFieldFocus(CARD_FIELD.cvc)}
              onStateChange={onFieldStateChange}
              placeholder={i18n.t(l.cvc)}
              required
              textStyle={fieldErrors[CARD_FIELD.cvc] ? errorTextStyle : textStyle}
            />
          </Box>
          <BivoTextInput
            bivoStore={bivoStore}
            defaultError={false}
            fieldName={CARD_FIELD.zip}
            keyboardType="number-pad"
            onBlur={() => onFieldBlur(CARD_FIELD.zip)}
            onFocus={() => onFieldFocus(CARD_FIELD.zip)}
            onStateChange={onFieldStateChange}
            placeholder={i18n.t(l.zip)}
            required
            textStyle={fieldErrors[CARD_FIELD.zip] ? errorTextStyle : textStyle}
          />
          {showOnlyVisaError && (
            <Box paddingTop="12px">
              <Text color="red" size="13pt" weight="semibold">
                {i18n.t(l.only_visa)}
              </Text>
            </Box>
          )}
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
