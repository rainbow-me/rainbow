import type { BivoSecureStore } from '@bivoglobal/payment-react-native';
import { createBaseStore } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { linkCardWithVault, type CardLinkProgress } from '../services/cardLinkService';
import { isPasskeyCancellation } from '../services/cashPasskeyService';
import { isCashUserServiceNetworkPolicyError } from '../services/cashUserServiceNetworkPolicy';
import type { CardBrand } from '../services/rampClient';
import { getTelemetryErrorReason } from '../utils/getTelemetryErrorReason';
import { useCashPaymentMethodStore } from './cashPaymentMethodStore';

export type CardLinkState = 'entry' | 'submitting' | 'submitError' | 'success';
export type CardLinkResult = 'completed' | 'cancelled' | 'failed' | 'skipped';

type CardLinkFlowStore = {
  state: CardLinkState;
  pendingProgress: CardLinkProgress | null;
  submit: (bivoStore: BivoSecureStore, cardBrand: CardBrand) => Promise<CardLinkResult>;
  reset: () => void;
};

let inFlight: AbortController | null = null;

export const useCardLinkFlowStore = createBaseStore<CardLinkFlowStore>((set, get) => ({
  state: 'entry',
  pendingProgress: null,

  submit: async (bivoStore, cardBrand) => {
    const { pendingProgress, state } = get();
    if (state === 'submitting' || state === 'success') return 'skipped';

    const controller = new AbortController();
    inFlight = controller;
    let progress = pendingProgress;
    set({ state: 'submitting' });

    try {
      const card = await linkCardWithVault(bivoStore, cardBrand, controller, {
        onProgress: next => {
          progress = next;
        },
        progress,
      });
      if (controller.signal.aborted) return 'cancelled';
      useCashPaymentMethodStore.getState().addLinkedCard(card);
      analytics.track(analytics.event.cashCardLinked, { brand: card.brand });
      set({ pendingProgress: null, state: 'success' });
      return 'completed';
    } catch (e) {
      if (controller.signal.aborted) return 'cancelled';
      // Return to the form without showing the generic card-link error.
      if (isCashUserServiceNetworkPolicyError(e) || isPasskeyCancellation(e)) {
        set({ pendingProgress: progress, state: 'entry' });
        return 'cancelled';
      }
      logger.error(new RainbowError('[cardLinkFlowStore]: Failed to link card', e));
      analytics.track(analytics.event.cashCardLinkFailed, { reason: getTelemetryErrorReason(e) });
      set({ pendingProgress: null, state: 'submitError' });
      return 'failed';
    } finally {
      if (inFlight === controller) inFlight = null;
    }
  },

  reset: () => {
    inFlight?.abort();
    inFlight = null;
    set({ pendingProgress: null, state: 'entry' });
  },
}));
