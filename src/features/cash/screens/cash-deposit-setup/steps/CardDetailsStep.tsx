import React, { memo } from 'react';

import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';

export const CardDetailsStep = memo(function CardDetailsStep() {
  return <SetupStepLayout title={i18n.t(i18n.l.cash.deposit_setup.card_details.title)} />;
});
