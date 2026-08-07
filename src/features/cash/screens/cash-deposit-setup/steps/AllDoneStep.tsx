import React, { memo } from 'react';

import * as i18n from '@/languages';

import { SetupSuccessStepLayout } from '../components/SetupSuccessStepLayout';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

const l = i18n.l.cash.deposit_setup.all_done;

export const AllDoneStep = memo(function AllDoneStep() {
  const { cancel } = useCashDepositSetupNavigation();

  return (
    <SetupSuccessStepLayout
      accessory={{ type: 'cancel', onPress: cancel }}
      actionLabel={i18n.t(l.add_bank_card)}
      description={i18n.t(l.description)}
      title={i18n.t(l.title)}
    />
  );
});
