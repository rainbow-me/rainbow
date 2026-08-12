import { createBaseStore } from '@storesjs/stores';

import { logger, RainbowError } from '@/logger';

import { removeLinkedCard } from '../services/cardRemovalService';
import { isPasskeyCancellation } from '../services/cashPasskeyService';
import { useCashPaymentMethodStore, type LinkedCard } from './cashPaymentMethodStore';

type CardRemovalResult = 'removed' | 'cancelled' | 'failed' | 'skipped';

type CardRemovalFlowStore = {
  state: 'idle' | 'removing';
  remove: (card: LinkedCard) => Promise<CardRemovalResult>;
};

export const useCardRemovalFlowStore = createBaseStore<CardRemovalFlowStore>((set, get) => ({
  state: 'idle',

  remove: async card => {
    if (get().state === 'removing') return 'skipped';
    if (useCashPaymentMethodStore.getState().linkedCard?.id !== card.id) return 'skipped';

    set({ state: 'removing' });
    try {
      await removeLinkedCard(card.id);
      // The card can be replaced while the delete is in flight, so only drop the one that was removed.
      if (useCashPaymentMethodStore.getState().linkedCard?.id === card.id) {
        useCashPaymentMethodStore.getState().clearLinkedCard();
      }
      return 'removed';
    } catch (error) {
      // A cancelled sign-in is a deliberate dismissal, not a failure.
      if (isPasskeyCancellation(error)) return 'cancelled';
      logger.error(new RainbowError('[cardRemovalFlowStore]: Failed to remove card', error));
      return 'failed';
    } finally {
      set({ state: 'idle' });
    }
  },
}));
