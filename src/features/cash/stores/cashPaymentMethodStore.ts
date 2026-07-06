import { createBaseStore } from '@storesjs/stores';

export type LinkedCard = {
  /** Rainbow internal card token id, sent as `cardId` on a buy order. */
  id: string;
  /** e.g. "Visa Debit" */
  brand: string;
  /** e.g. "8990" (no mask prefix) */
  last4: string;
};

type CashPaymentMethodStore = {
  linkedCard: LinkedCard | null;
  setLinkedCard: (linkedCard: LinkedCard) => void;
  clearLinkedCard: () => void;
};

export const useCashPaymentMethodStore = createBaseStore<CashPaymentMethodStore>(
  set => ({
    linkedCard: null,
    setLinkedCard: linkedCard => set({ linkedCard }),
    clearLinkedCard: () => set({ linkedCard: null }),
  }),
  { storageKey: 'cashPaymentMethod' }
);

export function useCashLinkedCard(): LinkedCard | null {
  return useCashPaymentMethodStore(state => state.linkedCard);
}

export const MOCK_LINKED_CARD: LinkedCard = { id: 'mock-card-1', brand: 'Visa Debit', last4: '8990' };
