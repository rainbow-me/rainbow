import React, { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';

import { getShouldCheckKycOnReturn, useKycReturnFlowStore, type KycReturnResult } from '../../../stores/kycReturnFlowStore';
import { CashDepositSetupNavigation } from '../cashDepositSetupNavigator';
import { checkKycOnReturn } from '../setupAction';
import { KycOutcomeSheet } from './KycOutcomeSheet';

function continueAfterKyc() {
  useKycReturnFlowStore.getState().reset();
  CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_PASSKEY);
}

export const KycReturnCheck = memo(function KycReturnCheck({ children }: { children: ReactNode }) {
  const [isChecking, setIsChecking] = useState(getShouldCheckKycOnReturn);
  const check = useRef<Promise<KycReturnResult> | null>(null);
  const active = useRef(false);
  const state = useKycReturnFlowStore(store => store.state);

  useLayoutEffect(() => {
    if (!isChecking) return;
    active.current = true;
    void (check.current ??= checkKycOnReturn(() => active.current)).then(() => {
      if (active.current) setIsChecking(false);
    });
    return () => {
      active.current = false;
    };
  }, [isChecking]);

  // The wizard must stay unmounted until the outcome is known, so the wait needs its own feedback:
  // a blank screen hides the header and close button for the whole, potentially long, status read.
  if (isChecking) {
    return (
      <CashStatusHalfSheet
        description={i18n.t(i18n.l.cash.deposit_setup.kyc.verifying_description)}
        status="inProgress"
        testID="cash-setup-kyc-return-checking"
        title={i18n.t(i18n.l.cash.deposit_setup.kyc.verifying_title)}
      />
    );
  }
  return (
    <>
      {children}
      {state !== 'idle' && state !== 'checking' ? <KycOutcomeSheet onContinue={continueAfterKyc} outcome={state} /> : null}
    </>
  );
});
