import React, { memo, useCallback } from 'react';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Separator, Text } from '@/design-system';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';

import { formatDateOfBirth, formatUsSsnMasked } from '../../../services/cashSetupIdentityService';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { CashDepositSetupNavigation } from '../cashDepositSetupNavigator';
import { SetupStepLayout } from '../components/SetupStepLayout';
import { useSubmitKycFlow } from './useSubmitKycFlow';

const l = i18n.l.cash.deposit_setup.review;

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
  const identity = useCashSetupSessionStore(state => (state.session.status === 'phoneVerified' ? state.session.identity : null));
  const governmentId = useCashSetupSessionStore(state => (state.session.status === 'phoneVerified' ? state.session.governmentId : null));
  const { submitting, submit } = useSubmitKycFlow();

  const editIdentity = useCallback(() => CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_IDENTITY), []);
  const editSsn = useCallback(() => CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_SSN), []);

  return (
    <SetupStepLayout
      actionDisabled={!identity || !governmentId}
      actionLabel={i18n.t(l.confirm)}
      actionLoading={submitting}
      backDisabled={submitting}
      onAction={submit}
      subtitle={i18n.t(l.subtitle)}
      title={i18n.t(l.title)}
    >
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
  );
});
