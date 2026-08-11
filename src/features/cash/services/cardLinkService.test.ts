import { type BivoSecureStore } from '@bivoglobal/payment-react-native';

import { linkCardWithVault } from './cardLinkService';
import { completeCardLinkSession, startCardLinkSession, type CardBrand } from './rampClient';

const mockSubmit = jest.fn();

jest.mock('./rampClient', () => ({
  startCardLinkSession: jest.fn(),
  completeCardLinkSession: jest.fn(),
}));

const mockStart = startCardLinkSession as jest.Mock;
const mockComplete = completeCardLinkSession as jest.Mock;

const SESSION = { linkUrl: 'https://vault/link', token: 'tok-1', tokenExpiresTime: '2999-01-01T00:00:00.000Z' };
const CARD = { id: 'card-1', brand: 'Visa', last4: '4242' };
const CARD_BRAND = 'CARD_BRAND_VISA' as CardBrand;
const bivoStore = { submit: mockSubmit } as unknown as BivoSecureStore;

beforeEach(() => {
  jest.clearAllMocks();
  mockStart.mockResolvedValue(SESSION);
  mockSubmit.mockResolvedValue({ success: true, data: { identifier: 'provider-card-1' } });
  mockComplete.mockResolvedValue(CARD);
});

describe('linkCardWithVault', () => {
  it('mints a session then submits to the vault and completes the session in order', async () => {
    const order: string[] = [];
    const abortController = new AbortController();
    mockStart.mockImplementation(async () => {
      order.push('session');
      return SESSION;
    });
    mockSubmit.mockImplementation(async () => {
      order.push('submit');
      return { success: true, data: { identifier: 'provider-card-1' } };
    });
    mockComplete.mockImplementation(async () => {
      order.push('complete');
      return CARD;
    });

    await expect(linkCardWithVault(bivoStore, CARD_BRAND, abortController)).resolves.toEqual(CARD);

    expect(order).toEqual(['session', 'submit', 'complete']);
    expect(mockStart).toHaveBeenCalledWith(abortController);
    expect(mockSubmit).toHaveBeenCalledWith(SESSION.linkUrl, SESSION.token);
    expect(mockComplete).toHaveBeenCalledWith({ brand: CARD_BRAND, providerCardId: 'provider-card-1' }, abortController);
  });

  it('does not touch the vault when the session fetch fails', async () => {
    mockStart.mockRejectedValue(new Error('no session'));

    await expect(linkCardWithVault(bivoStore, CARD_BRAND)).rejects.toThrow('no session');

    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('does not touch the vault when the session fetch is aborted', async () => {
    const abortController = new AbortController();
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    abortController.abort();
    mockStart.mockRejectedValue(abortError);

    await expect(linkCardWithVault(bivoStore, CARD_BRAND, abortController)).rejects.toMatchObject({ name: 'AbortError' });

    expect(mockStart).toHaveBeenCalledWith(abortController);
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('does not complete the session when aborted after vault submit', async () => {
    const abortController = new AbortController();
    mockSubmit.mockImplementation(async () => {
      abortController.abort();
      return { success: true, data: { identifier: 'provider-card-1' } };
    });

    await expect(linkCardWithVault(bivoStore, CARD_BRAND, abortController)).rejects.toMatchObject({ name: 'AbortError' });

    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('does not complete the session when the vault submit is rejected', async () => {
    mockSubmit.mockResolvedValue({ success: false });

    await expect(linkCardWithVault(bivoStore, CARD_BRAND)).rejects.toThrow('Bivo vault submit failed');

    expect(mockComplete).not.toHaveBeenCalled();
  });

  it('rejects when the vault response is missing the provider card id', async () => {
    mockSubmit.mockResolvedValue({ success: true, data: {} });

    await expect(linkCardWithVault(bivoStore, CARD_BRAND)).rejects.toThrow('Bivo vault response is missing the provider card id');

    expect(mockComplete).not.toHaveBeenCalled();
  });
});
