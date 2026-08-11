import type { BivoSecureStore } from '@bivoglobal/payment-react-native';
import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { linkCardWithVault } from '../services/cardLinkService';
import { isPasskeyCancellation } from '../services/cashPasskeyService';
import type { CardBrand } from '../services/rampClient';
import { useCashPaymentMethodStore } from './cashPaymentMethodStore';

export type CardLinkState = 'entry' | 'submitting' | 'submitError' | 'success';

type CardLinkFlowStore = {
  state: CardLinkState;
  submit: (bivoStore: BivoSecureStore, cardBrand: CardBrand) => Promise<void>;
  reset: () => void;
};

let inFlight: AbortController | null = null;

export const useCardLinkFlowStore = createBaseStore<CardLinkFlowStore>((set, get) => ({
  state: 'entry',

  submit: async (bivoStore, cardBrand) => {
    if (get().state === 'submitting') return;

    const controller = new AbortController();
    inFlight = controller;
    set({ state: 'submitting' });

    try {
      const card = await linkCardWithVault(bivoStore, cardBrand, controller);
      if (controller.signal.aborted) return;
      useCashPaymentMethodStore.getState().setLinkedCard(card);
      analytics.track(analytics.event.cashCardLinked, { brand: card.brand });
      set({ state: 'success' });
    } catch (e) {
      if (controller.signal.aborted) return;
      // Sign-in cancellation is a deliberate dismissal, not a failure: back to the form, silently.
      if (isPasskeyCancellation(e)) {
        set({ state: 'entry' });
        return;
      }
      logger.error(new RainbowError('[cardLinkFlowStore]: Failed to link card', e));
      analytics.track(analytics.event.cashCardLinkFailed, { reason: e instanceof Error ? e.message : String(e) });
      set({ state: 'submitError' });
    } finally {
      if (inFlight === controller) inFlight = null;
    }
  },

  reset: () => {
    inFlight?.abort();
    inFlight = null;
    set({ state: 'entry' });
  },
}));
