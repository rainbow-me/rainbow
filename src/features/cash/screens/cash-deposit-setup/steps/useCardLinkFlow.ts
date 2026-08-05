import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { BivoSecureStore } from '@bivoglobal/payment-react-native';
import { BIVO_ENV, BIVO_VAULT_ID } from 'react-native-dotenv';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';

import { linkCardWithVault } from '../../../services/cardLinkService';
import { isPasskeyCancellation } from '../../../services/cashPasskeyService';
import { useCashPaymentMethodStore } from '../../../stores/cashPaymentMethodStore';

export type CardLinkState = 'entry' | 'submitting' | 'submitError' | 'success';

export const CARD_FIELD = {
  number: 'card',
  expiry: 'exp',
  cvc: 'cvv',
  zip: 'zip',
} as const;

const SUBMIT_FIELDS = Object.values(CARD_FIELD);

function createBivoStore(): BivoSecureStore {
  return new BivoSecureStore(BIVO_VAULT_ID, BIVO_ENV);
}

export type UseCardLinkFlow = {
  state: CardLinkState;
  bivoStore: BivoSecureStore;
  isReady: boolean;
  onFieldStateChange: () => void;
  reset: () => void;
  submit: () => void;
};

export function useCardLinkFlow(): UseCardLinkFlow {
  const [flowState, setFlowState] = useState<CardLinkState>('entry');
  const [bivoStore] = useState(createBivoStore);
  const [, onFieldStateChange] = useReducer(i => i + 1, 0);
  const abortRef = useRef<AbortController | null>(null);

  const isReady = !bivoStore.isSubmitDisabled(SUBMIT_FIELDS);

  const submit = useCallback(async () => {
    if (abortRef.current) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setFlowState('submitting');

    try {
      const card = await linkCardWithVault(bivoStore, controller);
      if (controller.signal.aborted) return;
      useCashPaymentMethodStore.getState().setLinkedCard(card);
      analytics.track(analytics.event.cashCardLinked, { brand: card.brand });
      setFlowState('success');
    } catch (e) {
      if (controller.signal.aborted) return;
      // Sign-in cancellation is a deliberate dismissal, not a failure: back to the form, silently.
      if (isPasskeyCancellation(e)) {
        setFlowState('entry');
        return;
      }
      logger.error(new RainbowError('[useCardLinkFlow]: Failed to link card', e));
      analytics.track(analytics.event.cashCardLinkFailed, { reason: e instanceof Error ? e.message : String(e) });
      setFlowState('submitError');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [bivoStore]);

  const reset = useCallback(() => setFlowState('entry'), []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    state: flowState,
    bivoStore,
    isReady,
    onFieldStateChange,
    reset,
    submit,
  };
}
