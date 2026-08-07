import React, { memo, useCallback } from 'react';

import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import * as i18n from '@/languages';
import { RAINBOW_SUPPORT_URL } from '@/references/constants';
import { openInBrowser } from '@/utils/openInBrowser';

import { type KycOutcome } from '../../../services/userClient';
import { useCashDepositSetupNavigation } from '../useCashDepositSetupNavigation';

const l = i18n.l.cash.deposit_setup.kyc;
const IDENTITY_VERIFIED_ICON = '􀯧';

export const KycOutcomeSheet = memo(function KycOutcomeSheet({ onContinue, outcome }: { onContinue: () => void; outcome: KycOutcome }) {
  // Never `cancel()`: its warning sheet claims the user loses all progress, which
  // is untrue once the submission is with the provider.
  const { dismiss } = useCashDepositSetupNavigation();

  const contactSupport = useCallback(() => {
    openInBrowser(RAINBOW_SUPPORT_URL);
    dismiss();
  }, [dismiss]);

  switch (outcome) {
    case 'approved':
      return (
        <CashStatusHalfSheet
          action={{ label: i18n.t(i18n.l.button.continue), onPress: onContinue, testID: 'cash-setup-kyc-success-continue' }}
          description={i18n.t(l.verified_description)}
          status="success"
          successIcon={IDENTITY_VERIFIED_ICON}
          testID="cash-setup-kyc-success"
          title={i18n.t(l.verified_title)}
        />
      );
    case 'reviewing':
      return (
        <CashStatusHalfSheet
          action={{ label: i18n.t(l.reviewing_action), onPress: dismiss, testID: 'cash-setup-kyc-reviewing-got-it' }}
          description={i18n.t(l.reviewing_description)}
          status="reviewing"
          testID="cash-setup-kyc-reviewing"
          title={i18n.t(l.reviewing_title)}
        />
      );
    case 'rejected':
      return (
        <CashStatusHalfSheet
          description={i18n.t(l.rejected_description)}
          primaryAction={{ label: i18n.t(l.contact_support), onPress: contactSupport, testID: 'cash-setup-kyc-rejected-support' }}
          secondaryAction={{ label: i18n.t(l.close), onPress: dismiss, testID: 'cash-setup-kyc-rejected-close' }}
          status="error"
          testID="cash-setup-kyc-rejected"
          title={i18n.t(l.rejected_title)}
        />
      );
  }
});
