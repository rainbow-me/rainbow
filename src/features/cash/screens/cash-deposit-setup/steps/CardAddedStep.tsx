import React, { memo } from 'react';

import * as i18n from '@/languages';

import { SetupSuccessStepLayout } from '../components/SetupSuccessStepLayout';

export const CardAddedStep = memo(function CardAddedStep() {
  return (
    <SetupSuccessStepLayout
      accessory={{ type: 'handle' }}
      actionLabel={i18n.t(i18n.l.cash.deposit_setup.finish)}
      description={i18n.t(i18n.l.cash.deposit_setup.card_added.description)}
      title={i18n.t(i18n.l.cash.deposit_setup.card_added.title)}
    />
  );
});
