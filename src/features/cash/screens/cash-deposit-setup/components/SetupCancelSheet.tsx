import React, { memo } from 'react';

import { TapToDismiss } from '@/components/TapToDismiss';
import { CashStatusPanel } from '@/features/cash/components/CashStatusHalfSheet';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';

const l = i18n.l.cash.deposit_setup.cancel_sheet;

export const SetupCancelSheet = memo(function SetupCancelSheet() {
  const { goBack, pop } = useNavigation<typeof Routes.CASH_SETUP_CANCEL_SHEET>();

  const confirm = () => pop(2);

  return (
    <>
      <CashStatusPanel
        content={{
          description: i18n.t(l.description),
          primaryAction: { label: i18n.t(l.continue), onPress: goBack, testID: 'cash-setup-cancel-continue' },
          secondaryAction: { label: i18n.t(l.confirm), onPress: confirm, testID: 'cash-setup-cancel-confirm' },
          status: 'warning',
          testID: 'cash-setup-cancel-sheet',
          title: i18n.t(l.title),
        }}
      />
      <TapToDismiss />
    </>
  );
});
