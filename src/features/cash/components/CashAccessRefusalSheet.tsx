import React, { memo } from 'react';

import { useHardwareBack } from '@/framework/ui/hooks/useHardwareBack';
import * as i18n from '@/languages';

import { useCashAccessRefusalStore } from '../stores/cashAccessRefusalStore';
import { CashStatusHalfSheet } from './CashStatusHalfSheet';

const networkPolicyL = i18n.l.cash.network_policy;
const unavailableL = i18n.l.cash.access_unavailable;

export const CashAccessRefusalSheet = memo(function CashAccessRefusalSheet() {
  const reason = useCashAccessRefusalStore(state => state.reason);
  const visible = reason !== null;
  useHardwareBack(() => true, !visible, [visible]);

  const { dismiss } = useCashAccessRefusalStore.getState();
  switch (reason) {
    case null:
      return null;
    case 'networkPolicy':
      return (
        <CashStatusHalfSheet
          description={i18n.t(networkPolicyL.description)}
          globalOverlay
          primaryAction={{ label: i18n.t(networkPolicyL.continue), onPress: dismiss, testID: 'cash-network-policy-continue' }}
          status="networkPolicy"
          testID="cash-network-policy-warning"
          title={i18n.t(networkPolicyL.title)}
        />
      );
    case 'unavailable':
      return (
        <CashStatusHalfSheet
          description={i18n.t(unavailableL.description)}
          globalOverlay
          primaryAction={{ label: i18n.t(unavailableL.got_it), onPress: dismiss, testID: 'cash-access-unavailable-dismiss' }}
          status="info"
          testID="cash-access-unavailable"
          title={i18n.t(unavailableL.title)}
        />
      );
  }
});
