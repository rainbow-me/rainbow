import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { useCashAuthTokenStore } from '../stores/cashAuthTokenStore';
import { getCashPlatformClient } from './cashPlatformClient';
import { ensureAccessToken } from './cashSignInService';
import {
  CardBrand,
  completeCardLinkSession,
  createBuyOrder,
  getOrder,
  isDefinitiveRejection,
  OrderStatus,
  RampCryptoAsset,
  RampNetwork,
  startCardLinkSession,
  type BuyOrder,
  type CreateBuyOrderParams,
  type CreatedBuyOrder,
} from './rampClient';

jest.mock('./cashPlatformClient', () => ({
  getCashPlatformClient: jest.fn(),
  buildAuthenticatedHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
}));

jest.mock('./cashSignInService', () => ({
  ensureAccessToken: jest.fn(),
}));

const get = jest.fn();
const post = jest.fn();
const mockEnsureAccessToken = ensureAccessToken as jest.Mock;

const SESSION = { linkUrl: 'https://link', token: 'vault-token', tokenExpiresTime: '2026-07-24T00:00:00Z' };
const CREATE_BUY_ORDER_PARAMS: CreateBuyOrderParams = {
  id: '997b3d75-9f76-4038-a173-73c7ff37992f',
  walletAddress: '0x4d957c58d081c1c8c8aafe1e08de047fff19eb88',
  cryptoAsset: { asset: RampCryptoAsset.USDC, network: RampNetwork.ArbitrumTestnet },
  depositAmount: '0.10',
  cardId: '4a2dab9c-3bb6-4c32-8aea-e5fd4ad4c771',
};
const CREATED_BUY_ORDER: CreatedBuyOrder = {
  id: CREATE_BUY_ORDER_PARAMS.id,
  status: OrderStatus.Pending,
  createdTime: '2026-07-29T16:07:57.965076Z',
};
const BUY_ORDER: BuyOrder = {
  ...CREATED_BUY_ORDER,
  cryptoAmount: { amount: '0.10', asset: CREATE_BUY_ORDER_PARAMS.cryptoAsset },
  fiatAmount: { amount: '0.10', currency: 'USD' },
  status: OrderStatus.Pending,
  walletAddress: CREATE_BUY_ORDER_PARAMS.walletAddress,
};

function fetchError(status: number, message: string) {
  return new RainbowFetchError({ message, response: { status } as unknown as Response });
}

beforeEach(() => {
  jest.clearAllMocks();
  (getCashPlatformClient as jest.Mock).mockReturnValue({ get, post });
  mockEnsureAccessToken.mockResolvedValue('jwt-1');
  useCashAuthTokenStore.getState().setToken({ accessToken: 'jwt-1', expiresAt: Date.now() + 60_000 });
  post.mockResolvedValue({ data: SESSION });
});

describe('startCardLinkSession', () => {
  it('sends the user JWT as the bearer', async () => {
    await expect(startCardLinkSession()).resolves.toEqual(SESSION);

    expect(mockEnsureAccessToken).toHaveBeenCalledWith('cardLink');
    expect(post).toHaveBeenCalledWith(
      '/ramp/payment-methods/link-card-session',
      {},
      { abortController: undefined, headers: { Authorization: 'Bearer jwt-1' } }
    );
  });

  it('on 401 clears the cached token, signs in again, and retries once', async () => {
    post.mockRejectedValueOnce(fetchError(401, 'unauthorized'));
    mockEnsureAccessToken.mockResolvedValueOnce('jwt-stale').mockResolvedValueOnce('jwt-fresh');

    await expect(startCardLinkSession()).resolves.toEqual(SESSION);

    expect(useCashAuthTokenStore.getState().token).toBeNull();
    expect(mockEnsureAccessToken).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][2].headers).toEqual({ Authorization: 'Bearer jwt-fresh' });
  });

  it('propagates a second 401 without further retries', async () => {
    post.mockRejectedValue(fetchError(401, 'unauthorized'));

    await expect(startCardLinkSession()).rejects.toThrow('unauthorized');
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('propagates non-401 errors without retrying', async () => {
    post.mockRejectedValue(fetchError(500, 'server error'));

    await expect(startCardLinkSession()).rejects.toThrow('server error');
    expect(post).toHaveBeenCalledTimes(1);
    expect(useCashAuthTokenStore.getState().token).not.toBeNull();
  });
});

describe('completeCardLinkSession', () => {
  it('sends the detected brand and uses the response brand', async () => {
    post.mockResolvedValue({ data: { card: { brand: CardBrand.Visa, id: 'card-1', lastFourDigits: '8990' } } });

    await expect(completeCardLinkSession({ brand: CardBrand.Visa, providerCardId: 'prov-1' })).resolves.toEqual({
      brand: 'Visa',
      id: 'card-1',
      last4: '8990',
    });
    expect(post).toHaveBeenCalledWith(
      '/ramp/payment-methods/link-card-session/complete',
      { brand: CardBrand.Visa, providerCardId: 'prov-1' },
      { abortController: undefined, headers: { Authorization: 'Bearer jwt-1' } }
    );
  });
});

describe('buy orders', () => {
  it('creates a buy order with the authenticated ramp endpoint', async () => {
    post.mockResolvedValue({ data: CREATED_BUY_ORDER });

    await expect(createBuyOrder(CREATE_BUY_ORDER_PARAMS)).resolves.toEqual(CREATED_BUY_ORDER);

    expect(mockEnsureAccessToken).toHaveBeenCalledWith('addCash');
    expect(post).toHaveBeenCalledWith('/ramp/orders/buy', CREATE_BUY_ORDER_PARAMS, {
      headers: { Authorization: 'Bearer jwt-1' },
    });
  });

  it('fetches and unwraps an order by id', async () => {
    const abortController = new AbortController();
    get.mockResolvedValue({ data: { order: BUY_ORDER } });

    await expect(getOrder(CREATE_BUY_ORDER_PARAMS.id, abortController)).resolves.toEqual(BUY_ORDER);

    expect(mockEnsureAccessToken).toHaveBeenCalledWith('addCash');
    expect(get).toHaveBeenCalledWith(`/ramp/orders/${CREATE_BUY_ORDER_PARAMS.id}`, {
      abortController,
      headers: { Authorization: 'Bearer jwt-1' },
    });
  });
});

// Callers use this to decide whether a failed write may still have taken effect, so every status
// answered `true` here is one whose retry is allowed to create a second order.
describe('isDefinitiveRejection', () => {
  const cases: { error: unknown; expected: boolean; label: string }[] = [
    { label: '400', error: fetchError(400, 'bad request'), expected: true },
    { label: '404', error: fetchError(404, 'not found'), expected: true },
    { label: '408', error: fetchError(408, 'request timeout'), expected: false },
    { label: '422', error: fetchError(422, 'unprocessable'), expected: true },
    { label: '429', error: fetchError(429, 'too many requests'), expected: false },
    { label: '500', error: fetchError(500, 'server error'), expected: false },
    { label: 'a transport error with no response', error: new Error('network down'), expected: false },
  ];

  it.each(cases)('answers $expected for $label', ({ error, expected }) => {
    expect(isDefinitiveRejection(error)).toBe(expected);
  });
});
