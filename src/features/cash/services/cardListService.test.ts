import { logger } from '@/logger';

import { useCashAccountStore } from '../stores/cashAccountStore';
import { useCashPaymentMethodStore, type LinkedCard } from '../stores/cashPaymentMethodStore';
import { loadLinkedCards } from './cardListService';
import { listCardsWithCachedAuth } from './rampClient';

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('./rampClient', () => ({
  listCardsWithCachedAuth: jest.fn(),
}));

const mockListCardsWithCachedAuth = jest.mocked(listCardsWithCachedAuth);

const CARD: LinkedCard = { id: 'card_1', brand: 'Visa Debit', last4: '8990' };
const OTHER_CARD: LinkedCard = { id: 'card_2', brand: 'Visa', last4: '1115' };

const store = () => useCashPaymentMethodStore.getState();
const cards = () => store().cards;

function deferListCards() {
  let settle!: (result: { authRequired?: boolean; cards?: LinkedCard[]; error?: unknown }) => void;
  const pending = new Promise<{ authRequired?: boolean; cards?: LinkedCard[]; error?: unknown }>(resolve => {
    settle = resolve;
  });
  mockListCardsWithCachedAuth.mockImplementationOnce(async () => {
    const { authRequired, cards, error } = await pending;
    if (error) throw error;
    if (authRequired) return { kind: 'authRequired' };
    return { kind: 'success', data: cards ?? [] };
  });
  return settle;
}

beforeEach(() => {
  jest.clearAllMocks();
  store().clear();
  useCashAccountStore.getState().setUserId('user-1');
  mockListCardsWithCachedAuth.mockResolvedValue({ kind: 'success', data: [CARD] });
});

describe('loadLinkedCards', () => {
  it('stores the fetched list', async () => {
    const settle = deferListCards();

    const load = loadLinkedCards();
    expect(cards()).toBeNull();

    settle({ cards: [CARD] });
    await expect(load).resolves.toBe('completed');

    expect(cards()).toEqual([CARD]);
    expect(mockListCardsWithCachedAuth).toHaveBeenCalledWith();
  });

  it('joins an in-flight request that started from the same list', async () => {
    const settle = deferListCards();

    const first = loadLinkedCards();
    const second = loadLinkedCards();
    expect(mockListCardsWithCachedAuth).toHaveBeenCalledTimes(1);

    settle({ cards: [CARD] });
    await Promise.all([first, second]);
    expect(cards()).toEqual([CARD]);
  });

  it('starts a fresh request, and drops the old one, when the list changed since it started', async () => {
    const settleStale = deferListCards();
    const stale = loadLinkedCards();

    store().addLinkedCard(CARD);
    mockListCardsWithCachedAuth.mockResolvedValue({ kind: 'success', data: [OTHER_CARD] });
    await loadLinkedCards();
    expect(mockListCardsWithCachedAuth).toHaveBeenCalledTimes(2);
    expect(cards()).toEqual([OTHER_CARD]);

    settleStale({ cards: [] });
    await stale;
    expect(cards()).toEqual([OTHER_CARD]);
  });

  it('starts a fresh request and drops the old response when the account changes while the list is null', async () => {
    const settleOldAccount = deferListCards();
    const oldAccountLoad = loadLinkedCards();

    useCashAccountStore.getState().setUserId('user-2');
    expect(cards()).toBeNull();
    mockListCardsWithCachedAuth.mockResolvedValue({ kind: 'success', data: [OTHER_CARD] });

    await expect(loadLinkedCards()).resolves.toBe('completed');
    expect(mockListCardsWithCachedAuth).toHaveBeenCalledTimes(2);
    expect(cards()).toEqual([OTHER_CARD]);

    settleOldAccount({ cards: [CARD] });
    await expect(oldAccountLoad).resolves.toBe('completed');
    expect(cards()).toEqual([OTHER_CARD]);
  });

  it('drops a stale failure when the list was mutated while the request was in flight', async () => {
    const settle = deferListCards();

    const load = loadLinkedCards();
    store().addLinkedCard(CARD);

    settle({ error: new Error('network down') });
    await expect(load).resolves.toBe('completed');

    expect(cards()).toEqual([CARD]);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('keeps the list fetched earlier this session when a refresh fails', async () => {
    store().setCards([CARD]);
    mockListCardsWithCachedAuth.mockRejectedValue(new Error('network down'));

    await expect(loadLinkedCards()).resolves.toBe('completed');

    expect(cards()).toEqual([CARD]);
    expect(logger.error).toHaveBeenCalled();
  });

  it('rejects when the first load fails', async () => {
    mockListCardsWithCachedAuth.mockRejectedValue(new Error('network down'));

    await expect(loadLinkedCards()).rejects.toThrow('network down');

    expect(cards()).toBeNull();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('drops an authRequired answer from a request that went stale while in flight', async () => {
    const settle = deferListCards();
    const stale = loadLinkedCards();

    store().addLinkedCard(CARD);
    settle({ authRequired: true });

    await expect(stale).resolves.toBe('completed');
    expect(cards()).toEqual([CARD]);
  });

  it('returns authRequired without discarding cards fetched earlier this session', async () => {
    store().setCards([CARD]);
    mockListCardsWithCachedAuth.mockResolvedValue({ kind: 'authRequired' });

    await expect(loadLinkedCards()).resolves.toBe('authRequired');

    expect(cards()).toEqual([CARD]);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
