import React, { memo } from 'react';

import { useHardwareBack } from '@/framework/ui/hooks/useHardwareBack';
import * as i18n from '@/languages';

import { useCashUserServiceNetworkPolicyStore } from '../stores/cashUserServiceNetworkPolicyStore';
import { CashStatusHalfSheet } from './CashStatusHalfSheet';

const l = i18n.l.cash.network_policy;

export const CashUserServiceNetworkPolicySheet = memo(function CashUserServiceNetworkPolicySheet() {
  const visible = useCashUserServiceNetworkPolicyStore(state => state.visible);
  useHardwareBack(() => true, !visible, [visible]);

  if (!visible) return null;

  return (
    <CashStatusHalfSheet
      description={i18n.t(l.description)}
      globalOverlay
      primaryAction={{
        label: i18n.t(l.continue),
        onPress: useCashUserServiceNetworkPolicyStore.getState().dismiss,
        testID: 'cash-network-policy-continue',
      }}
      status="networkPolicy"
      testID="cash-network-policy-warning"
      title={i18n.t(l.title)}
    />
  );
});
