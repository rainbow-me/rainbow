import React, { memo, useCallback } from 'react';

import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import * as i18n from '@/languages';

import { useSetupCancelSheetStore } from '../setupCancelSheetStore';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

const l = i18n.l.cash.deposit_setup.cancel_sheet;

export const SetupCancelSheet = memo(function SetupCancelSheet() {
  const visible = useSetupCancelSheetStore(state => state.visible);
  const close = useSetupCancelSheetStore(state => state.close);
  const { dismiss } = useCashDepositSetupNavigation();

  const confirm = useCallback(() => {
    close();
    dismiss();
  }, [close, dismiss]);

  if (!visible) return null;

  return (
    <CashStatusHalfSheet
      description={i18n.t(l.description)}
      primaryAction={{ label: i18n.t(l.continue), onPress: close, testID: 'cash-setup-cancel-continue' }}
      secondaryAction={{ label: i18n.t(l.confirm), onPress: confirm, testID: 'cash-setup-cancel-confirm' }}
      status="warning"
      testID="cash-setup-cancel-sheet"
      title={i18n.t(l.title)}
    />
  );
});
