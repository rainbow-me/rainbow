import { createBaseStore, createDerivedStore } from '@storesjs/stores';

import { useCashPaymentMethodStore } from './cashPaymentMethodStore';
import { selectIsPhoneVerified, useCashSetupSessionStore } from './cashSetupSessionStore';
import {
  deriveCashDepositSetupStatus,
  EMPTY_CASH_DEPOSIT_SETUP_FACTS,
  type CashDepositSetupFacts,
  type CashDepositSetupStatus,
} from './deriveCashDepositSetupStatus';

type CashDepositSetupStore = {
  facts: CashDepositSetupFacts;
  setFact: (key: keyof CashDepositSetupFacts, value: boolean) => void;
};

export const useCashDepositSetupStore = createBaseStore<CashDepositSetupStore>(
  set => ({
    facts: EMPTY_CASH_DEPOSIT_SETUP_FACTS,
    setFact: (key, value) => set(state => ({ facts: { ...state.facts, [key]: value } })),
  }),
  { storageKey: 'cashDepositSetup' }
);

export const useCashDepositSetupStatusStore = createDerivedStore<CashDepositSetupStatus>(
  $ => {
    const facts = $(useCashDepositSetupStore, state => state.facts);
    const phoneVerified = $(useCashSetupSessionStore, selectIsPhoneVerified);
    const linkedCard = $(useCashPaymentMethodStore, state => state.linkedCard);
    return deriveCashDepositSetupStatus({ ...facts, phoneVerified, hasLinkedCard: linkedCard != null });
  },
  { lockDependencies: true }
);
