import React, { memo } from 'react';

import { shallowEqual } from '@storesjs/stores';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Box, Separator, Text } from '@/design-system';
import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import * as i18n from '@/languages';
import { goBack } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { RAINBOW_SUPPORT_URL } from '@/references/constants';
import { openInBrowser } from '@/utils/openInBrowser';

import { formatDateOfBirth, formatUsSsnMasked } from '../../../services/cashSetupIdentityService';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { CashDepositSetupNavigation } from '../cashDepositSetupNavigator';
import { KycOutcomeSheet } from '../components/KycOutcomeSheet';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { submitReview } from '../setupAction';
import { completeSetupStep } from '../setupNavigation';
import { useSubmitReviewFlowStore } from './useSubmitReviewFlow';

const l = i18n.l.cash.deposit_setup.review;
const kycL = i18n.l.cash.deposit_setup.kyc;
const recoveryLockedL = i18n.l.cash.deposit_setup.recovery_locked;

function editIdentity() {
  CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_IDENTITY);
}

function editSsn() {
  CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_SSN);
}

function continueAfterVerification() {
  useSubmitReviewFlowStore.getState().reset();
  completeSetupStep();
}

function returnToReview() {
  useSubmitReviewFlowStore.getState().reset();
}

function contactSupport() {
  openInBrowser(RAINBOW_SUPPORT_URL);
  goBack();
}

function ReviewRow({
  disabled,
  label,
  onEdit,
  testID,
  value,
}: {
  disabled: boolean;
  label: string;
  onEdit: () => void;
  testID: string;
  value: string;
}) {
  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingVertical="12px">
      <Box gap={10}>
        <Text color="labelSecondary" size="13pt" weight="semibold">
          {label}
        </Text>
        <Text color="label" size="17pt" weight="bold">
          {value}
        </Text>
      </Box>
      <ButtonPressAnimation disabled={disabled} onPress={onEdit} scaleTo={0.9} testID={testID}>
        <Box background="fillTertiary" borderRadius={14} height={{ custom: 28 }} justifyContent="center" paddingHorizontal="12px">
          <Text color="label" size="13pt" weight="bold">
            {i18n.t(l.edit)}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

export const ReviewStep = memo(function ReviewStep() {
  const identity = useCashSetupSessionStore(state => state.getIdentity(), shallowEqual);
  const governmentId = useCashSetupSessionStore(state => state.getGovernmentId(), shallowEqual);
  const state = useSubmitReviewFlowStore(store => store.state);
  const submitting = state === 'submitting';

  return (
    <>
      <SetupStepLayout subtitle={i18n.t(l.subtitle)} title={i18n.t(l.title)}>
        {identity && governmentId && (
          <Box paddingTop="24px">
            <Box background="fillTertiary" borderRadius={20} paddingHorizontal="16px" paddingVertical="4px">
              <ReviewRow
                disabled={submitting}
                label={i18n.t(l.name)}
                onEdit={editIdentity}
                testID="cash-setup-review-edit-identity"
                value={`${identity.firstName} ${identity.lastName}`}
              />
              <Separator color="separatorTertiary" />
              <ReviewRow
                disabled={submitting}
                label={i18n.t(l.date_of_birth)}
                onEdit={editIdentity}
                testID="cash-setup-review-edit-dob"
                value={formatDateOfBirth(identity.dateOfBirth)}
              />
              <Separator color="separatorTertiary" />
              <ReviewRow
                disabled={submitting}
                label={i18n.t(l.ssn)}
                onEdit={editSsn}
                testID="cash-setup-review-edit-ssn"
                value={formatUsSsnMasked(governmentId.value)}
              />
            </Box>
          </Box>
        )}
      </SetupStepLayout>

      {state === 'submitting' ? (
        <CashStatusHalfSheet
          description={i18n.t(kycL.verifying_description)}
          status="inProgress"
          testID="cash-setup-kyc-verifying"
          title={i18n.t(kycL.verifying_title)}
        />
      ) : state === 'locked' ? (
        <CashStatusHalfSheet
          description={i18n.t(recoveryLockedL.description)}
          primaryAction={{
            label: i18n.t(kycL.contact_support),
            onPress: contactSupport,
            testID: 'cash-setup-recovery-locked-support',
          }}
          secondaryAction={{ label: i18n.t(kycL.close), onPress: goBack, testID: 'cash-setup-recovery-locked-close' }}
          status="error"
          testID="cash-setup-recovery-locked"
          title={i18n.t(recoveryLockedL.title)}
        />
      ) : state === 'identityMismatch' ? (
        <CashStatusHalfSheet
          description={i18n.t(l.error_description)}
          primaryAction={{
            label: i18n.t(l.edit_details),
            onPress: returnToReview,
            testID: 'cash-setup-kyc-error-edit-details',
          }}
          status="error"
          testID="cash-setup-kyc-error"
          title={i18n.t(l.error_title)}
        />
      ) : state === 'error' ? (
        <CashStatusHalfSheet
          description={i18n.t(l.submission_error_description)}
          primaryAction={{
            label: i18n.t(l.try_again),
            onPress: submitReview,
            testID: 'cash-setup-review-error-try-again',
          }}
          status="error"
          testID="cash-setup-review-error"
          title={i18n.t(l.submission_error_title)}
        />
      ) : state === 'entry' ? null : (
        <KycOutcomeSheet onContinue={continueAfterVerification} outcome={state} />
      )}
    </>
  );
});
