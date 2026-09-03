import type { BivoSecureStore } from '@bivoglobal/payment-react-native';
import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { linkCardWithVault } from '../services/cardLinkService';
import { isPasskeyCancellation } from '../services/cashPasskeyService';
import type { CardBrand } from '../services/rampClient';
import { getTelemetryErrorReason } from '../utils/getTelemetryErrorReason';
import { useCashPaymentMethodStore } from './cashPaymentMethodStore';

export type CardLinkState = 'entry' | 'submitting' | 'submitError' | 'success';
export type CardLinkResult = 'completed' | 'cancelled' | 'failed' | 'skipped';

type CardLinkFlowStore = {
  state: CardLinkState;
  submit: (bivoStore: BivoSecureStore, cardBrand: CardBrand) => Promise<CardLinkResult>;
  reset: () => void;
};

let inFlight: AbortController | null = null;

export const useCardLinkFlowStore = createBaseStore<CardLinkFlowStore>((set, get) => ({
  state: 'entry',

  submit: async (bivoStore, cardBrand) => {
    const { state } = get();
    if (state === 'submitting' || state === 'success') return 'skipped';

    const controller = new AbortController();
    inFlight = controller;
    set({ state: 'submitting' });

    try {
      const card = await linkCardWithVault(bivoStore, cardBrand, controller);
      if (controller.signal.aborted) return 'cancelled';
      useCashPaymentMethodStore.getState().addLinkedCard(card);
      analytics.track(analytics.event.cashCardLinked, { brand: card.brand });
      set({ state: 'success' });
      return 'completed';
    } catch (e) {
      if (controller.signal.aborted) return 'cancelled';
      // Sign-in cancellation is a deliberate dismissal, not a failure: back to the form, silently.
      if (isPasskeyCancellation(e)) {
        set({ state: 'entry' });
        return 'cancelled';
      }
      logger.error(new RainbowError('[cardLinkFlowStore]: Failed to link card', e));
      analytics.track(analytics.event.cashCardLinkFailed, { reason: getTelemetryErrorReason(e) });
      set({ state: 'submitError' });
      return 'failed';
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
