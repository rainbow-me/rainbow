import { createBaseStore } from '@storesjs/stores';

export type CashAccessRefusalReason = 'networkPolicy' | 'unavailable';

type CashAccessRefusalStore = {
  reason: CashAccessRefusalReason | null;
  dismiss: () => void;
  show: (reason: CashAccessRefusalReason) => void;
};

export const useCashAccessRefusalStore = createBaseStore<CashAccessRefusalStore>(set => ({
  reason: null,
  dismiss: () => set({ reason: null }),
  show: reason => set({ reason }),
}));
