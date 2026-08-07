import React, { memo } from 'react';

import { CashStepLayout, type CashStepLayoutProps } from '@/features/cash/components/CashStepLayout';
import * as i18n from '@/languages';

import { useCashDepositSetupNavigationStore } from '../cashDepositSetupNavigator';
import { useIsSetupSubmittingStore } from '../setupSubmittingStore';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';
import { SetupCancelButton } from './SetupCancelButton';

type SetupStepLayoutProps = Omit<
  CashStepLayoutProps,
  'actionLabel' | 'actionTestID' | 'backDisabled' | 'backTestID' | 'headerRight' | 'onAction' | 'onBack'
> & {
  /** Overrides the default "Next" CTA label. */
  actionLabel?: string;
  /** Overrides the default `next()` press handler. */
  onAction?: () => void;
};

export const SetupStepLayout = memo(function SetupStepLayout({ actionLabel, onAction, ...props }: SetupStepLayoutProps) {
  const { next, back, cancel } = useCashDepositSetupNavigation();
  const submitting = useIsSetupSubmittingStore();
  const hasHistory = useCashDepositSetupNavigationStore(state => state.history.length > 0);

  return (
    <CashStepLayout
      {...props}
      actionLabel={actionLabel ?? i18n.t(i18n.l.cash.deposit_setup.next)}
      actionTestID="cash-setup-next"
      backDisabled={submitting}
      backTestID="cash-setup-back"
      headerRight={<SetupCancelButton disabled={submitting} onPress={cancel} />}
      onAction={onAction ?? next}
      onBack={hasHistory ? back : undefined}
    />
  );
});
