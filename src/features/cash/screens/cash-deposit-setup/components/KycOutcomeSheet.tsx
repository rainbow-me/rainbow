import React, { memo } from 'react';

import { CashStatusHalfSheet } from '@/features/cash/components/CashStatusHalfSheet';
import * as i18n from '@/languages';
import { goBack, navigate } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { RAINBOW_SUPPORT_URL } from '@/references/constants';
import { openInBrowser } from '@/utils/openInBrowser';

import { type KycOutcome, type KycRejectionReason } from '../../../services/userClient';

const l = i18n.l.cash.deposit_setup.kyc;
const IDENTITY_VERIFIED_ICON = '􀯧';

function contactSupport() {
  openInBrowser(RAINBOW_SUPPORT_URL);
  goBack();
}

function otherDepositMethods() {
  navigate(Routes.FIAT_ON_RAMP_SHEET);
}

export const KycOutcomeSheet = memo(function KycOutcomeSheet({
  onContinue,
  outcome,
  kycRejectionReason,
}: {
  onContinue: () => void;
  outcome: KycOutcome;
  kycRejectionReason?: KycRejectionReason;
}) {
  // Never `cancel()`: its warning sheet claims the user loses all progress, which
  // is untrue once the submission is with the provider.
  switch (outcome) {
    case 'approved':
      return (
        <CashStatusHalfSheet
          primaryAction={{ label: i18n.t(i18n.l.button.continue), onPress: onContinue, testID: 'cash-setup-kyc-success-continue' }}
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
          primaryAction={{ label: i18n.t(l.reviewing_action), onPress: goBack, testID: 'cash-setup-kyc-reviewing-got-it' }}
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
          secondaryAction={{ label: i18n.t(l.close), onPress: goBack, testID: 'cash-setup-kyc-rejected-close' }}
          status="error"
          testID="cash-setup-kyc-rejected"
          title={i18n.t(l.rejected_title)}
        />
      );
    case 'unsupportedState': {
      const regionName = kycRejectionReason?.unsupportedLocation?.regionName;
      const regionCode = kycRejectionReason?.unsupportedLocation?.regionCode;
      return (
        <CashStatusHalfSheet
          description={
            regionCode ? i18n.t(l.state_not_supported_description, { regionCode }) : i18n.t(l.state_not_supported_description_fallback)
          }
          primaryAction={{
            label: i18n.t(i18n.l.cash.deposit_intro.other_deposit_methods),
            onPress: otherDepositMethods,
            testID: 'cash-setup-kyc-state-not-supported-other-methods',
            textSize: '20pt',
          }}
          secondaryAction={{
            label: i18n.t(l.close),
            onPress: goBack,
            testID: 'cash-setup-kyc-state-not-supported-close',
            textSize: '20pt',
          }}
          status="info"
          testID="cash-setup-kyc-state-not-supported"
          title={regionName ? i18n.t(l.state_not_supported_title, { regionName }) : i18n.t(l.state_not_supported_title_fallback)}
        />
      );
    }
  }
});
