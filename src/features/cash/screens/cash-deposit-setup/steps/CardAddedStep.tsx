import React, { memo } from 'react';

import * as i18n from '@/languages';

import { SetupStepLayout } from '../components/SetupStepLayout';

export const CardAddedStep = memo(function CardAddedStep() {
  return (
    <SetupStepLayout actionLabel={i18n.t(i18n.l.cash.deposit_setup.finish)} title={i18n.t(i18n.l.cash.deposit_setup.card_added.title)} />
  );
});
