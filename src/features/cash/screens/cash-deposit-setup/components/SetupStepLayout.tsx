import React, { memo } from 'react';

import { CashStepLayout, type CashStepLayoutProps } from '@/features/cash/components/CashStepLayout';
import * as i18n from '@/languages';

import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

type SetupStepLayoutProps = Omit<CashStepLayoutProps, 'actionLabel' | 'actionTestID' | 'backTestID' | 'onAction' | 'onBack'> & {
  /** Overrides the default "Next" CTA label. */
  actionLabel?: string;
  /** Overrides the default `next()` press handler. */
  onAction?: () => void;
};

export const SetupStepLayout = memo(function SetupStepLayout({ actionLabel, onAction, ...props }: SetupStepLayoutProps) {
  const { next, back } = useCashDepositSetupNavigation();

  return (
    <CashStepLayout
      {...props}
      actionLabel={actionLabel ?? i18n.t(i18n.l.cash.deposit_setup.next)}
      actionTestID="cash-setup-next"
      backTestID="cash-setup-back"
      onAction={onAction ?? next}
      onBack={back}
    />
  );
});
