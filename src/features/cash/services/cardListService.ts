import { logger, RainbowError } from '@/logger';

import { useCashAccountStore } from '../stores/cashAccountStore';
import { useCashPaymentMethodStore, type LinkedCard } from '../stores/cashPaymentMethodStore';
import { listCardsWithCachedAuth } from './rampClient';

export type CardListResult = 'completed' | 'authRequired';

type CardListRequest = {
  cardsAtRequest: LinkedCard[] | null;
  promise: Promise<CardListResult>;
  userIdAtRequest: string | null;
};

let inFlight: CardListRequest | null = null;

export function loadLinkedCards(): Promise<CardListResult> {
  const { cards } = useCashPaymentMethodStore.getState();
  const { userId } = useCashAccountStore.getState();
  if (inFlight?.cardsAtRequest === cards && inFlight.userIdAtRequest === userId) return inFlight.promise;

  const request: CardListRequest = {
    cardsAtRequest: cards,
    promise: fetchCards(userId, cards).finally(() => {
      if (inFlight === request) inFlight = null;
    }),
    userIdAtRequest: userId,
  };
  inFlight = request;
  return request.promise;
}

async function fetchCards(userIdAtRequest: string | null, cardsAtRequest: LinkedCard[] | null): Promise<CardListResult> {
  const isStale = () =>
    useCashAccountStore.getState().userId !== userIdAtRequest || useCashPaymentMethodStore.getState().cards !== cardsAtRequest;
  try {
    const result = await listCardsWithCachedAuth();
    if (isStale()) return 'completed';
    if (result.kind === 'authRequired') return 'authRequired';
    useCashPaymentMethodStore.getState().setCards(result.data);
    return 'completed';
  } catch (error) {
    if (isStale()) return 'completed';
    if (cardsAtRequest === null) throw error;
    logger.error(new RainbowError('[cardListService]: Failed to refresh cards', error));
    return 'completed';
  }
}
