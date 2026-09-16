import React, { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

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

  if (isChecking) return null;
  return (
    <>
      {children}
      {state !== 'idle' && state !== 'checking' ? <KycOutcomeSheet onContinue={continueAfterKyc} outcome={state} /> : null}
    </>
  );
});
