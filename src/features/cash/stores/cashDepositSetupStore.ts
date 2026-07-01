import { createBaseStore } from '@storesjs/stores';

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

export function useCashDepositSetupStatus(): CashDepositSetupStatus {
  return useCashDepositSetupStore(state => deriveCashDepositSetupStatus(state.facts));
}
