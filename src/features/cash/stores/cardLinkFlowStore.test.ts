import type { BivoSecureStore } from '@bivoglobal/payment-react-native';

import { analytics } from '@/analytics';

import { linkCardWithVault } from '../services/cardLinkService';
import { isPasskeyCancellation } from '../services/cashPasskeyService';
import type { CardBrand } from '../services/rampClient';
import { useCardLinkFlowStore } from './cardLinkFlowStore';
import { selectCashLinkedCard, useCashPaymentMethodStore, type LinkedCard } from './cashPaymentMethodStore';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: {
      cashCardLinked: 'cash.card_linked',
      cashCardLinkFailed: 'cash.card_link_failed',
    },
  },
}));

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('../services/cardLinkService', () => ({
  linkCardWithVault: jest.fn(),
}));

jest.mock('../services/cashPasskeyService', () => ({
  isPasskeyCancellation: jest.fn(),
}));

const mockLinkCardWithVault = linkCardWithVault as jest.Mock;
const mockIsPasskeyCancellation = isPasskeyCancellation as jest.Mock;
const track = analytics.track as jest.Mock;

const CARD: LinkedCard = { id: 'card_1', brand: 'Visa Debit', last4: '8990' };
const CARD_BRAND = 'CARD_BRAND_VISA' as CardBrand;
const BIVO_STORE = {} as BivoSecureStore;

const flow = () => useCardLinkFlowStore.getState();
const linkedCard = () => selectCashLinkedCard(useCashPaymentMethodStore.getState());

function deferLink() {
  let settle!: (result: { card?: LinkedCard; error?: unknown }) => void;
  const pending = new Promise<{ card?: LinkedCard; error?: unknown }>(resolve => {
    settle = resolve;
  });
  mockLinkCardWithVault.mockImplementation(async () => {
    const { card, error } = await pending;
    if (error) throw error;
    return card;
  });
  return settle;
}

beforeEach(() => {
  jest.clearAllMocks();
  flow().reset();
  useCashPaymentMethodStore.getState().clear();
  mockLinkCardWithVault.mockResolvedValue(CARD);
  mockIsPasskeyCancellation.mockReturnValue(false);
});

describe('cardLinkFlowStore', () => {
  it('stores the card and reports success', async () => {
    await flow().submit(BIVO_STORE, CARD_BRAND);

    expect(flow().state).toBe('success');
    expect(linkedCard()).toEqual(CARD);
    expect(track).toHaveBeenCalledWith('cash.card_linked', { brand: CARD.brand });
  });

  it('returns to the form silently when the passkey prompt is cancelled', async () => {
    mockLinkCardWithVault.mockRejectedValue(new Error('user cancelled'));
    mockIsPasskeyCancellation.mockReturnValue(true);

    await flow().submit(BIVO_STORE, CARD_BRAND);

    expect(flow().state).toBe('entry');
    expect(linkedCard()).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it('reports a failure without storing a card', async () => {
    mockLinkCardWithVault.mockRejectedValue(new Error('vault exploded'));

    await flow().submit(BIVO_STORE, CARD_BRAND);

    expect(flow().state).toBe('submitError');
    expect(linkedCard()).toBeNull();
    expect(track).toHaveBeenCalledWith('cash.card_link_failed', { reason: 'unknown' });
  });

  it('ignores a second submit while one is in flight', async () => {
    const settle = deferLink();

    const first = flow().submit(BIVO_STORE, CARD_BRAND);
    await flow().submit(BIVO_STORE, CARD_BRAND);
    expect(mockLinkCardWithVault).toHaveBeenCalledTimes(1);

    settle({ card: CARD });
    await first;
    expect(flow().state).toBe('success');
  });

  it('discards a response that resolves after a reset', async () => {
    const settle = deferLink();

    const submitted = flow().submit(BIVO_STORE, CARD_BRAND);
    expect(flow().state).toBe('submitting');

    flow().reset();
    settle({ card: CARD });
    await submitted;

    expect(flow().state).toBe('entry');
    expect(linkedCard()).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it('discards a rejection that arrives after a reset', async () => {
    const settle = deferLink();

    const submitted = flow().submit(BIVO_STORE, CARD_BRAND);
    flow().reset();
    settle({ error: new Error('vault exploded') });
    await submitted;

    expect(flow().state).toBe('entry');
    expect(track).not.toHaveBeenCalled();
  });
});
