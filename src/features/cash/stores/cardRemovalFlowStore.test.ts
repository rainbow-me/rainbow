import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { isPasskeyCancellation } from '../services/cashPasskeyService';
import { deleteCard, listCards } from '../services/rampClient';
import { useCardRemovalFlowStore } from './cardRemovalFlowStore';
import { selectCashLinkedCard, useCashPaymentMethodStore, type LinkedCard } from './cashPaymentMethodStore';

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('../services/rampClient', () => ({
  ...jest.requireActual('../services/rampClient'),
  deleteCard: jest.fn(),
  listCards: jest.fn(),
}));

jest.mock('../services/cashPasskeyService', () => ({
  isPasskeyCancellation: jest.fn(),
}));

const mockDeleteCard = deleteCard as jest.Mock;
const mockListCards = listCards as jest.Mock;
const mockIsPasskeyCancellation = isPasskeyCancellation as jest.Mock;

const CARD: LinkedCard = { id: 'card_1', brand: 'Visa Debit', last4: '8990' };
const REPLACEMENT_CARD: LinkedCard = { id: 'card_2', brand: 'Visa Debit', last4: '1234' };

const flow = () => useCardRemovalFlowStore.getState();
const linkedCard = () => selectCashLinkedCard(useCashPaymentMethodStore.getState());

function fetchError(status: number): RainbowFetchError {
  return new RainbowFetchError({ message: 'request failed', response: { status } as Response });
}

function deferDelete() {
  let settle!: (error?: unknown) => void;
  const pending = new Promise<unknown>(resolve => {
    settle = resolve;
  });
  mockDeleteCard.mockImplementation(async () => {
    const error = await pending;
    if (error) throw error;
  });
  return settle;
}

beforeEach(() => {
  jest.clearAllMocks();
  useCardRemovalFlowStore.setState({ state: 'idle' });
  useCashPaymentMethodStore.getState().clear();
  useCashPaymentMethodStore.getState().addLinkedCard(CARD);
  mockDeleteCard.mockResolvedValue(undefined);
  mockListCards.mockResolvedValue([CARD]);
  mockIsPasskeyCancellation.mockReturnValue(false);
});

describe('cardRemovalFlowStore', () => {
  it('drops the card after the platform deletes it', async () => {
    expect(await flow().remove(CARD)).toBe('removed');

    expect(mockDeleteCard).toHaveBeenCalledWith(CARD.id);
    expect(linkedCard()).toBeNull();
    expect(flow().state).toBe('idle');
  });

  it('keeps the card without reconciling when the sign-in prompt is cancelled', async () => {
    mockDeleteCard.mockRejectedValue(new Error('user cancelled'));
    mockIsPasskeyCancellation.mockReturnValue(true);

    expect(await flow().remove(CARD)).toBe('cancelled');

    expect(mockListCards).not.toHaveBeenCalled();
    expect(linkedCard()).toEqual(CARD);
    expect(flow().state).toBe('idle');
  });

  it('keeps the card after a definitive failure and allows an immediate retry', async () => {
    mockDeleteCard.mockRejectedValueOnce(fetchError(422));

    expect(await flow().remove(CARD)).toBe('failed');
    expect(linkedCard()).toEqual(CARD);
    expect(mockListCards).not.toHaveBeenCalled();

    expect(await flow().remove(CARD)).toBe('removed');
    expect(linkedCard()).toBeNull();
  });

  it('ignores a second removal while the first is in flight', async () => {
    const settle = deferDelete();

    const first = flow().remove(CARD);
    expect(await flow().remove(CARD)).toBe('skipped');

    expect(mockDeleteCard).toHaveBeenCalledTimes(1);
    settle();
    await first;
  });

  it('treats a missing card as already removed', async () => {
    mockDeleteCard.mockRejectedValue(fetchError(404));

    expect(await flow().remove(CARD)).toBe('removed');

    expect(linkedCard()).toBeNull();
    expect(mockListCards).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'a transport error', failure: new Error('connection lost') },
    { label: 'a 408', failure: fetchError(408) },
    { label: 'a 429', failure: fetchError(429) },
    { label: 'a 500', failure: fetchError(500) },
  ])('clears the card when reconciliation confirms $label was an ambiguous delete that succeeded', async ({ failure }) => {
    mockDeleteCard.mockRejectedValue(failure);
    mockListCards.mockResolvedValue([]);

    expect(await flow().remove(CARD)).toBe('removed');

    expect(mockListCards).toHaveBeenCalledTimes(1);
    expect(linkedCard()).toBeNull();
  });

  it('retains the card when reconciliation confirms an ambiguous delete failed', async () => {
    mockDeleteCard.mockRejectedValue(new Error('connection lost'));

    expect(await flow().remove(CARD)).toBe('failed');
    expect(linkedCard()).toEqual(CARD);
  });

  it('retains the card when an ambiguous delete cannot be reconciled', async () => {
    mockDeleteCard.mockRejectedValue(new Error('connection lost'));
    mockListCards.mockRejectedValue(new Error('still offline'));

    expect(await flow().remove(CARD)).toBe('failed');
    expect(linkedCard()).toEqual(CARD);
  });

  it('does not overwrite a replacement card when an old request settles', async () => {
    const settle = deferDelete();

    const removal = flow().remove(CARD);
    useCashPaymentMethodStore.getState().addLinkedCard(REPLACEMENT_CARD);
    settle();
    await removal;

    expect(linkedCard()).toEqual(REPLACEMENT_CARD);
    expect(flow().state).toBe('idle');
  });
});
