import { useCallback, useEffect, useReducer, useState } from 'react';

import { BivoSecureStore } from '@bivoglobal/payment-react-native';
import { createStoreActions } from '@storesjs/stores';
import { BIVO_ENV, BIVO_VAULT_ID } from 'react-native-dotenv';

import { useCardLinkFlowStore, type CardLinkState } from '../../../stores/cardLinkFlowStore';

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

const cardLinkFlowActions = createStoreActions(useCardLinkFlowStore);

export type UseCardLinkFlow = {
  state: CardLinkState;
  bivoStore: BivoSecureStore;
  isReady: boolean;
  onFieldStateChange: () => void;
  reset: () => void;
  submit: () => void;
};

export function useCardLinkFlow(): UseCardLinkFlow {
  const state = useCardLinkFlowStore(state => state.state);
  const [bivoStore] = useState(createBivoStore);
  const [, onFieldStateChange] = useReducer(i => i + 1, 0);

  const isReady = !bivoStore.isSubmitDisabled(SUBMIT_FIELDS);

  const submit = useCallback(() => {
    cardLinkFlowActions.submit(bivoStore);
  }, [bivoStore]);

  useEffect(() => cardLinkFlowActions.reset, []);

  return {
    state,
    bivoStore,
    isReady,
    onFieldStateChange,
    reset: cardLinkFlowActions.reset,
    submit,
  };
}
