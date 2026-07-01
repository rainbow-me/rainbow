import React, { memo } from 'react';

import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';

export const IdentityStep = memo(function IdentityStep() {
  return <SetupStepLayout title={i18n.t(i18n.l.cash.deposit_setup.identity.title)} />;
});
