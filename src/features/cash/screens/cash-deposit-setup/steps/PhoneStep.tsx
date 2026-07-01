import React, { memo } from 'react';

import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';

export const PhoneStep = memo(function PhoneStep() {
  return <SetupStepLayout title={i18n.t(i18n.l.cash.deposit_setup.phone.title)} />;
});
