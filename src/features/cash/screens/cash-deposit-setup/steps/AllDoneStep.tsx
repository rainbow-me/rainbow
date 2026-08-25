import React, { memo } from 'react';

import * as i18n from '@/languages';

import { SetupSuccessStepLayout } from '../components/SetupSuccessStepLayout';
import { cancelSetup } from '../setupNavigation';

const l = i18n.l.cash.deposit_setup.all_done;

export const AllDoneStep = memo(function AllDoneStep() {
  return (
    <SetupSuccessStepLayout
      accessory={{ type: 'cancel', onPress: cancelSetup }}
      description={i18n.t(l.description)}
      title={i18n.t(l.title)}
    />
  );
});
