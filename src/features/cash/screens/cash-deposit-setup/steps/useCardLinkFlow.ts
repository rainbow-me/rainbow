import { useCallback, useEffect, useReducer, useState } from 'react';

import { BivoSecureStore } from '@bivoglobal/payment-react-native';
import { createStoreActions } from '@storesjs/stores';
import { BIVO_ENV, BIVO_VAULT_ID } from 'react-native-dotenv';

import { CardBrand } from '../../../services/rampClient';
import { useCardLinkFlowStore, type CardLinkState } from '../../../stores/cardLinkFlowStore';

export const CARD_FIELD = {
  number: 'card',
  expiry: 'exp',
  cvc: 'cvv',
  zip: 'zip',
} as const;

const SUBMIT_FIELDS = Object.values(CARD_FIELD);

type CardField = (typeof CARD_FIELD)[keyof typeof CARD_FIELD];
const BIVO_CARD_BRANDS: Record<string, CardBrand> = {
  visa: CardBrand.Visa,
  mastercard: CardBrand.Mastercard,
  amex: CardBrand.Amex,
  discover: CardBrand.Discover,
};

function createBivoStore(): BivoSecureStore {
  return new BivoSecureStore(BIVO_VAULT_ID, BIVO_ENV);
}

const cardLinkFlowActions = createStoreActions(useCardLinkFlowStore);

export type UseCardLinkFlow = {
  state: CardLinkState;
  bivoStore: BivoSecureStore;
  cardBrand: CardBrand | null;
  fieldErrors: Record<CardField, boolean>;
  isReady: boolean;
  showOnlyVisaError: boolean;
  onCardTypeChange: (cardType: string) => void;
  onFieldBlur: (fieldName: CardField) => void;
  onFieldFocus: (fieldName: CardField) => void;
  onFieldStateChange: () => void;
  reset: () => void;
  submit: () => void;
};

export function useCardLinkFlow(): UseCardLinkFlow {
  const state = useCardLinkFlowStore(state => state.state);
  const [bivoStore] = useState(createBivoStore);
  const [cardBrand, setCardBrand] = useState<CardBrand | null>(null);
  const [focusedField, setFocusedField] = useState<CardField | null>(null);
  const [, onFieldStateChange] = useReducer(i => i + 1, 0);

  const onCardTypeChange = useCallback((cardType: string) => {
    setCardBrand(BIVO_CARD_BRANDS[cardType] ?? null);
  }, []);

  const onFieldFocus = useCallback((fieldName: CardField) => setFocusedField(fieldName), []);

  const onFieldBlur = useCallback((fieldName: CardField) => setFocusedField(current => (current === fieldName ? null : current)), []);

  // Bivo validates a field before invoking our onBlur, so once a field loses focus a live read of
  // bivoStore is current; the focusedField setState doubles as the rerender that refreshes these reads.
  const hasUnsupportedCardBrand = Boolean(bivoStore.form[CARD_FIELD.number]?.trim()) && cardBrand !== CardBrand.Visa;

  function isErrored(fieldName: CardField): boolean {
    if (focusedField === fieldName) return false;
    return Boolean(bivoStore.errors[fieldName]) || (fieldName === CARD_FIELD.number && hasUnsupportedCardBrand);
  }

  const fieldErrors = {
    [CARD_FIELD.number]: isErrored(CARD_FIELD.number),
    [CARD_FIELD.expiry]: isErrored(CARD_FIELD.expiry),
    [CARD_FIELD.cvc]: isErrored(CARD_FIELD.cvc),
    [CARD_FIELD.zip]: isErrored(CARD_FIELD.zip),
  };

  const showOnlyVisaError = fieldErrors[CARD_FIELD.number] && hasUnsupportedCardBrand;

  const isReady = cardBrand === CardBrand.Visa && !bivoStore.isSubmitDisabled(SUBMIT_FIELDS);

  const submit = useCallback(() => {
    if (cardBrand !== CardBrand.Visa) return;
    cardLinkFlowActions.submit(bivoStore, cardBrand);
  }, [bivoStore, cardBrand]);

  useEffect(() => cardLinkFlowActions.reset, []);

  return {
    state,
    bivoStore,
    cardBrand,
    fieldErrors,
    isReady,
    showOnlyVisaError,
    onCardTypeChange,
    onFieldBlur,
    onFieldFocus,
    onFieldStateChange,
    reset: cardLinkFlowActions.reset,
    submit,
  };
}
