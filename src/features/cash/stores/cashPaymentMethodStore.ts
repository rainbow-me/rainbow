import { createBaseStore, shallowEqual } from '@storesjs/stores';

export type LinkedCard = {
  /** Rainbow internal card token id, sent as `cardId` on a buy order. */
  id: string;
  /** e.g. "Visa Debit" */
  brand: string;
  /** e.g. "8990" (no mask prefix) */
  last4: string;
};

type CashPaymentMethodStore = {
  /** Only the id survives restarts — card objects always come fresh from the backend. */
  lastUsedCardId: string | null;
  /** null until the list has been fetched (or a card linked) this session. */
  cards: LinkedCard[] | null;
  setCards: (cards: LinkedCard[]) => void;
  addLinkedCard: (card: LinkedCard) => void;
  removeCard: (cardId: string) => void;
  clear: () => void;
};

export const useCashPaymentMethodStore = createBaseStore<CashPaymentMethodStore>(
  (set, get) => ({
    lastUsedCardId: null,
    cards: null,
    setCards: cards => set({ cards }),
    addLinkedCard: card => {
      const others = (get().cards ?? []).filter(existing => existing.id !== card.id);
      set({ lastUsedCardId: card.id, cards: [...others, card] });
    },
    removeCard: cardId => {
      const { cards, lastUsedCardId } = get();
      if (!cards) return;
      set({
        lastUsedCardId: lastUsedCardId === cardId ? null : lastUsedCardId,
        cards: cards.filter(card => card.id !== cardId),
      });
    },
    clear: () => set({ lastUsedCardId: null, cards: null }),
  }),
  {
    storageKey: 'cashPaymentMethod',
    version: 1,
    partialize: state => ({ lastUsedCardId: state.lastUsedCardId }),
    // v0 persisted the whole linked card; carry over only its id.
    migrate: persistedState => {
      const legacy = persistedState as { linkedCard?: { id?: string } | null } | undefined;
      return { lastUsedCardId: legacy?.linkedCard?.id ?? null };
    },
  }
);

type CardSelectorState = Pick<CashPaymentMethodStore, 'cards' | 'lastUsedCardId'>;

export function selectCashLinkedCards(state: Pick<CashPaymentMethodStore, 'cards'>): LinkedCard[] {
  return state.cards ?? [];
}

export function selectCashLinkedCard(state: CardSelectorState): LinkedCard | null {
  const cards = selectCashLinkedCards(state);
  return cards.find(card => card.id === state.lastUsedCardId) ?? cards[0] ?? null;
}

export function useCashLinkedCard(): LinkedCard | null {
  return useCashPaymentMethodStore(selectCashLinkedCard);
}

export type CashFundingState = { kind: 'loading' } | { kind: 'none' } | { kind: 'card'; card: LinkedCard };

export function selectCashFundingState(state: CardSelectorState): CashFundingState {
  if (state.cards === null) return { kind: 'loading' };
  const card = selectCashLinkedCard(state);
  return card ? { kind: 'card', card } : { kind: 'none' };
}

export function useCashFundingState(): CashFundingState {
  return useCashPaymentMethodStore(selectCashFundingState, shallowEqual);
}

export const MOCK_LINKED_CARD: LinkedCard = { id: 'mock-card-1', brand: 'Visa Debit', last4: '8990' };
