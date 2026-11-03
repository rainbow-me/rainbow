import { createBaseStore } from '@storesjs/stores';

export type CashAuthIntent = { kind: 'loadCards' } | { kind: 'resumeOrder' };

export type CashAuthGateStatus =
  | { step: 'closed' }
  | { step: 'authRequired'; intent: CashAuthIntent }
  | { step: 'error'; intent: CashAuthIntent };

export type OpenCashAuthGateStatus = Exclude<CashAuthGateStatus, { step: 'closed' }>;

type CashAuthGateStore = {
  status: CashAuthGateStatus;
  park: (intent: CashAuthIntent) => void;
  fail: (intent: CashAuthIntent) => void;
  clear: () => void;
};

// Deliberately memory-only: the gate is recomputed from persisted inputs on every sheet open,
// so persisting it would only add rehydration edge cases.
export const useCashAuthGateStore = createBaseStore<CashAuthGateStore>(set => ({
  status: { step: 'closed' },
  park: intent => set({ status: { step: 'authRequired', intent } }),
  fail: intent => set({ status: { step: 'error', intent } }),
  clear: () => set({ status: { step: 'closed' } }),
}));
