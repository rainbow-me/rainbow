import { createDerivedStore } from '@storesjs/stores';

import { useCashAccountStore } from './cashAccountStore';
import { useCashPaymentMethodStore } from './cashPaymentMethodStore';
import { deriveCashDepositSetupStatus, type CashDepositSetupStatus } from './deriveCashDepositSetupStatus';

export const useCashDepositSetupStatusStore = createDerivedStore<CashDepositSetupStatus>(
  $ => {
    const hasAccount = $(useCashAccountStore, state => state.userId != null);
    const linkedCard = $(useCashPaymentMethodStore, state => state.linkedCard);
    return deriveCashDepositSetupStatus({ hasAccount, hasLinkedCard: linkedCard != null });
  },
  { lockDependencies: true }
);
