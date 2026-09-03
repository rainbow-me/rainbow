import { ResponseParseError } from '@/framework/data/http/parseResponse';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { logger } from '@/logger';

import { useCashAuthTokenStore } from '../stores/cashAuthTokenStore';
import { getCashPlatformClient } from './cashPlatformClient';
import { ensureAccessToken, getCachedAccessToken } from './cashSignInService';
import {
  CardBrand,
  completeCardLinkSession,
  createBuyOrder,
  getOrderWithCachedAuth,
  linkWallet,
  listCards,
  listCardsWithCachedAuth,
  listWallets,
  OrderFailureReason,
  OrderStatus,
  RampCryptoAsset,
  RampNetwork,
  startCardLinkSession,
  WalletSignatureMethod,
  type BuyOrder,
  type CreateBuyOrderParams,
  type WalletSignature,
} from './rampClient';

jest.mock('./cashPlatformClient', () => ({
  getCashPlatformClient: jest.fn(),
  buildAuthenticatedHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
}));

jest.mock('./cashSignInService', () => ({
  ensureAccessToken: jest.fn(),
  getCachedAccessToken: jest.fn(),
}));

jest.mock('@/logger', () => ({
  logger: { warn: jest.fn() },
}));

const get = jest.fn();
const post = jest.fn();
const mockEnsureAccessToken = ensureAccessToken as jest.Mock;
const mockGetCachedAccessToken = jest.mocked(getCachedAccessToken);

// `tokenExpiresTime` rides along on the wire but nothing reads it, so the parsed session drops it.
const SESSION = { linkUrl: 'https://link', token: 'vault-token', tokenExpiresTime: '2026-07-24T00:00:00Z' };
const PARSED_SESSION = { linkUrl: SESSION.linkUrl, token: SESSION.token };
const WALLET_SIGNATURE: WalletSignature = {
  hexSignature: '0xsig',
  method: WalletSignatureMethod.EthPersonalSign,
  timestamp: '1750789885',
};
const CREATE_BUY_ORDER_PARAMS: CreateBuyOrderParams = {
  id: '997b3d75-9f76-4038-a173-73c7ff37992f',
  walletAddress: '0x4d957c58d081c1c8c8aafe1e08de047fff19eb88',
  cryptoAsset: { asset: RampCryptoAsset.USDC, network: RampNetwork.ArbitrumTestnet },
  depositAmount: '0.10',
  cardId: '4a2dab9c-3bb6-4c32-8aea-e5fd4ad4c771',
};
const CREATED_TIME = '2026-07-29T16:07:57.965076Z';
const COMPLETED_TIME = '2026-07-29T16:08:20.000Z';
const PENDING_BUY_ORDER: Extract<BuyOrder, { status: OrderStatus.Pending }> = {
  id: CREATE_BUY_ORDER_PARAMS.id,
  status: OrderStatus.Pending,
};
const PROCESSING_BUY_ORDER: Extract<BuyOrder, { status: OrderStatus.Processing }> = {
  id: CREATE_BUY_ORDER_PARAMS.id,
  status: OrderStatus.Processing,
};
const COMPLETED_ORDER_BODY = {
  id: CREATE_BUY_ORDER_PARAMS.id,
  status: OrderStatus.Completed as const,
  cryptoAmount: { amount: '0.10', asset: CREATE_BUY_ORDER_PARAMS.cryptoAsset },
  fiatAmount: { amount: '0.10', currency: 'USD' },
  createdTime: CREATED_TIME,
  walletAddress: CREATE_BUY_ORDER_PARAMS.walletAddress,
  transactionHash: '0xtx',
  completedTime: COMPLETED_TIME,
};
// Timestamps arrive as ISO strings and land as epoch ms; `asset` keeps only the network, the one part anything reads.
const COMPLETED_BUY_ORDER = {
  ...COMPLETED_ORDER_BODY,
  cryptoAmount: { amount: '0.10', asset: { network: CREATE_BUY_ORDER_PARAMS.cryptoAsset.network } },
  createdTime: new Date(CREATED_TIME).getTime(),
  completedTime: new Date(COMPLETED_TIME).getTime(),
} satisfies Extract<BuyOrder, { status: OrderStatus.Completed }>;
const FAILED_BUY_ORDER: Extract<BuyOrder, { status: OrderStatus.Failed }> = {
  id: CREATE_BUY_ORDER_PARAMS.id,
  status: OrderStatus.Failed,
  failureReason: OrderFailureReason.PaymentRejected,
};

function fetchError(status: number, message: string) {
  return new RainbowFetchError({ message, response: { status } as unknown as Response });
}

async function fetchOrder(orderId: string, abortController?: AbortController): Promise<BuyOrder> {
  const result = await getOrderWithCachedAuth(orderId, abortController);
  if (result.kind !== 'success') throw new Error('Expected an order');
  return result.data;
}

beforeEach(() => {
  jest.clearAllMocks();
  (getCashPlatformClient as jest.Mock).mockReturnValue({ get, post });
  mockEnsureAccessToken.mockResolvedValue('jwt-1');
  mockGetCachedAccessToken.mockReturnValue('jwt-1');
  useCashAuthTokenStore.getState().setToken({ accessToken: 'jwt-1', expiresAt: Date.now() + 60_000 });
  post.mockResolvedValue({ data: SESSION });
});

describe('startCardLinkSession', () => {
  it('sends the user JWT as the bearer', async () => {
    await expect(startCardLinkSession()).resolves.toEqual(PARSED_SESSION);

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

    await expect(startCardLinkSession()).resolves.toEqual(PARSED_SESSION);

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

describe('listCardsWithCachedAuth', () => {
  it('returns authRequired without sending a request when no token is cached', async () => {
    mockGetCachedAccessToken.mockReturnValue(null);

    await expect(listCardsWithCachedAuth()).resolves.toEqual({ kind: 'authRequired' });

    expect(get).not.toHaveBeenCalled();
    expect(mockEnsureAccessToken).not.toHaveBeenCalled();
  });

  it('returns parsed cards without starting a ceremony when a token is cached', async () => {
    get.mockResolvedValue({ data: {} });

    await expect(listCardsWithCachedAuth()).resolves.toEqual({ kind: 'success', data: [] });

    expect(get).toHaveBeenCalledWith('/ramp/payment-methods/cards', {
      abortController: undefined,
      headers: { Authorization: 'Bearer jwt-1' },
    });
    expect(mockEnsureAccessToken).not.toHaveBeenCalled();
  });

  it('clears a rejected cached token and returns authRequired without retrying', async () => {
    get.mockRejectedValue(fetchError(401, 'unauthorized'));

    await expect(listCardsWithCachedAuth()).resolves.toEqual({ kind: 'authRequired' });

    expect(get).toHaveBeenCalledTimes(1);
    expect(useCashAuthTokenStore.getState().token).toBeNull();
    expect(mockEnsureAccessToken).not.toHaveBeenCalled();
  });

  it('keeps a token minted by a newer sign-in when a stale request is rejected', async () => {
    get.mockImplementation(async () => {
      useCashAuthTokenStore.getState().setToken({ accessToken: 'jwt-2', expiresAt: Date.now() + 60_000 });
      throw fetchError(401, 'unauthorized');
    });

    await expect(listCardsWithCachedAuth()).resolves.toEqual({ kind: 'authRequired' });

    expect(useCashAuthTokenStore.getState().token?.accessToken).toBe('jwt-2');
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
    post.mockResolvedValue({ data: { id: CREATE_BUY_ORDER_PARAMS.id, status: 'ORDER_STATUS_NEW', createdTime: CREATED_TIME } });

    await expect(createBuyOrder(CREATE_BUY_ORDER_PARAMS)).resolves.toBeUndefined();

    expect(mockEnsureAccessToken).toHaveBeenCalledWith('addCash');
    expect(post).toHaveBeenCalledWith('/ramp/orders/buy', CREATE_BUY_ORDER_PARAMS, {
      headers: { Authorization: 'Bearer jwt-1' },
    });
  });

  it('fetches and unwraps an order by id on the cached token, never starting a ceremony', async () => {
    const abortController = new AbortController();
    get.mockResolvedValue({ data: { order: { ...PENDING_BUY_ORDER, id: 'different-response-id' } } });

    await expect(getOrderWithCachedAuth(CREATE_BUY_ORDER_PARAMS.id, abortController)).resolves.toEqual({
      kind: 'success',
      data: PENDING_BUY_ORDER,
    });

    expect(mockEnsureAccessToken).not.toHaveBeenCalled();
    expect(get).toHaveBeenCalledWith(`/ramp/orders/${CREATE_BUY_ORDER_PARAMS.id}`, {
      abortController,
      headers: { Authorization: 'Bearer jwt-1' },
    });
  });

  it('returns authRequired for an order read without sending a request when no token is cached', async () => {
    mockGetCachedAccessToken.mockReturnValue(null);

    await expect(getOrderWithCachedAuth(CREATE_BUY_ORDER_PARAMS.id)).resolves.toEqual({ kind: 'authRequired' });

    expect(get).not.toHaveBeenCalled();
    expect(mockEnsureAccessToken).not.toHaveBeenCalled();
  });
});

describe('response validation', () => {
  it('accepts a create response with no readable fields', async () => {
    post.mockResolvedValue({ data: {} });

    await expect(createBuyOrder(CREATE_BUY_ORDER_PARAMS)).resolves.toBeUndefined();
  });

  const readableOrders: { label: string; body: unknown; order: BuyOrder }[] = [
    { label: 'pending', body: PENDING_BUY_ORDER, order: PENDING_BUY_ORDER },
    { label: 'processing', body: PROCESSING_BUY_ORDER, order: PROCESSING_BUY_ORDER },
    { label: 'completed', body: COMPLETED_ORDER_BODY, order: COMPLETED_BUY_ORDER },
    { label: 'failed', body: FAILED_BUY_ORDER, order: FAILED_BUY_ORDER },
  ];

  // Every non-completed fixture carries nothing but its id and status: protojson omits each field the
  // backend has not populated, so that is what an unquoted order looks like on the wire.
  it.each(readableOrders)('accepts a $label order', async ({ body, order }) => {
    get.mockResolvedValue({ data: { order: body } });

    await expect(fetchOrder(CREATE_BUY_ORDER_PARAMS.id)).resolves.toEqual(order);
  });

  it.each([
    { label: 'pending', body: { ...COMPLETED_ORDER_BODY, status: OrderStatus.Pending }, order: PENDING_BUY_ORDER },
    { label: 'processing', body: { ...COMPLETED_ORDER_BODY, status: OrderStatus.Processing }, order: PROCESSING_BUY_ORDER },
    {
      label: 'failed',
      body: { ...COMPLETED_ORDER_BODY, status: OrderStatus.Failed, failureReason: OrderFailureReason.PaymentRejected },
      order: FAILED_BUY_ORDER,
    },
  ])('drops completed-order fields from a $label order', async ({ body, order }) => {
    get.mockResolvedValue({ data: { order: body } });

    await expect(fetchOrder(CREATE_BUY_ORDER_PARAMS.id)).resolves.toEqual(order);
  });

  const withCryptoAmount = (amount: unknown) => ({
    order: { ...COMPLETED_ORDER_BODY, cryptoAmount: { ...COMPLETED_ORDER_BODY.cryptoAmount, amount } },
  });
  const withAsset = (asset: Record<string, unknown>) => ({
    order: {
      ...COMPLETED_ORDER_BODY,
      cryptoAmount: { ...COMPLETED_ORDER_BODY.cryptoAmount, asset: { ...COMPLETED_ORDER_BODY.cryptoAmount.asset, ...asset } },
    },
  });
  const withoutField = (field: keyof typeof COMPLETED_ORDER_BODY) => {
    const order: Record<string, unknown> = { ...COMPLETED_ORDER_BODY };
    delete order[field];
    return { order };
  };

  const unreadableOrderBodies: { label: string; body: unknown }[] = [
    // rainbowFetch returns the raw text for any body that is not application/json.
    { label: 'a body that is not JSON', body: '<html>502 Bad Gateway</html>' },
    { label: 'an envelope with no order', body: {} },
    { label: 'an order with no status', body: { order: { id: CREATE_BUY_ORDER_PARAMS.id } } },
    { label: 'a status the client cannot act on', body: { order: { ...PENDING_BUY_ORDER, status: 'ORDER_STATUS_REFUNDED' } } },
  ];

  it.each(unreadableOrderBodies)('rejects $label', async ({ body }) => {
    get.mockResolvedValue({ data: body });

    await expect(fetchOrder(CREATE_BUY_ORDER_PARAMS.id)).rejects.toThrow(ResponseParseError);
  });

  const readableCompletedOrderBodies: { label: string; body: unknown }[] = [
    { label: 'no transaction hash', body: withoutField('transactionHash') },
    { label: 'no wallet address', body: withoutField('walletAddress') },
    { label: 'no fiat amount', body: withoutField('fiatAmount') },
    { label: 'no crypto amount', body: withoutField('cryptoAmount') },
  ];

  it.each(readableCompletedOrderBodies)('accepts a completed order with $label', async ({ body }) => {
    get.mockResolvedValue({ data: body });

    await expect(fetchOrder(CREATE_BUY_ORDER_PARAMS.id)).resolves.toMatchObject({
      id: CREATE_BUY_ORDER_PARAMS.id,
      status: OrderStatus.Completed,
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  const unusableCryptoAmounts: { label: string; body: unknown }[] = [
    { label: 'an unknown asset', body: withAsset({ asset: 'CRYPTO_ASSET_ETH' }) },
    { label: 'an unknown network', body: withAsset({ network: 'NETWORK_SOLANA' }) },
    { label: 'a malformed amount', body: withCryptoAmount('not-a-number') },
    { label: 'a zero amount', body: withCryptoAmount('0') },
    { label: 'a negative amount', body: withCryptoAmount('-1') },
  ];

  // An amount that cannot be turned into an Activity row drops out on its own rather than taking the
  // order down with it: the status still resolves, so the purchase is not stranded mid-poll.
  it.each(unusableCryptoAmounts)('drops a crypto amount with $label', async ({ body }) => {
    get.mockResolvedValue({ data: body });

    const order = await fetchOrder(CREATE_BUY_ORDER_PARAMS.id);

    expect(order.status).toBe(OrderStatus.Completed);
    if (order.status !== OrderStatus.Completed) throw new Error('Expected a completed order');
    expect(order.cryptoAmount).toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith('[rampClient] normalized malformed response from getOrder', {
      issues: expect.arrayContaining([
        expect.objectContaining({ code: expect.any(String), path: expect.stringContaining('order.cryptoAmount') }),
      ]),
    });
  });

  it('falls back to unspecified for a failure reason the client does not model', async () => {
    get.mockResolvedValue({ data: { order: { ...FAILED_BUY_ORDER, failureReason: 'ORDER_FAILURE_REASON_FRAUD' } } });

    await expect(fetchOrder(CREATE_BUY_ORDER_PARAMS.id)).resolves.toMatchObject({
      status: OrderStatus.Failed,
      failureReason: OrderFailureReason.Unspecified,
    });
  });

  it('falls back to unspecified when a failed order carries no reason', async () => {
    get.mockResolvedValue({ data: { order: { id: CREATE_BUY_ORDER_PARAMS.id, status: OrderStatus.Failed } } });

    await expect(fetchOrder(CREATE_BUY_ORDER_PARAMS.id)).resolves.toMatchObject({ failureReason: OrderFailureReason.Unspecified });
  });

  it('accepts a card brand the client does not model', async () => {
    post.mockResolvedValue({ data: { card: { brand: 'CARD_BRAND_JCB', id: 'card-1', lastFourDigits: '8990' } } });

    await expect(completeCardLinkSession({ brand: CardBrand.Unspecified, providerCardId: 'prov-1' })).resolves.toEqual({
      brand: 'Card',
      id: 'card-1',
      last4: '8990',
    });
  });

  it('rejects a card-link session with no vault url', async () => {
    post.mockResolvedValue({ data: { token: 'vault-token' } });

    await expect(startCardLinkSession()).rejects.toThrow(ResponseParseError);
  });

  it('rejects a linked card with no last four digits', async () => {
    post.mockResolvedValue({ data: { card: { brand: CardBrand.Visa, id: 'card-1' } } });

    await expect(completeCardLinkSession({ brand: CardBrand.Visa, providerCardId: 'prov-1' })).rejects.toThrow(ResponseParseError);
  });

  it('uses the submitted address when the linked-wallet response has no address', async () => {
    post.mockResolvedValue({ data: { wallet: { id: 'wallet-1' } } });

    await expect(linkWallet({ address: '0xabc', signature: WALLET_SIGNATURE })).resolves.toEqual({
      id: 'wallet-1',
      address: '0xabc',
    });
  });

  it.each([
    { label: 'missing', wallet: { address: '0xabc' } },
    { label: 'empty', wallet: { id: '', address: '0xabc' } },
  ])('rejects a linked-wallet response whose id is $label', async ({ wallet }) => {
    post.mockResolvedValue({ data: { wallet } });

    await expect(linkWallet({ address: '0xabc', signature: WALLET_SIGNATURE })).rejects.toThrow(ResponseParseError);
  });

  it('drops invalid wallets without losing valid wallets', async () => {
    get.mockResolvedValue({
      data: {
        wallets: [
          { id: 'wallet-invalid', address: '' },
          { id: 'wallet-valid', address: '0xabc' },
        ],
      },
    });

    await expect(listWallets()).resolves.toEqual([{ id: 'wallet-valid', address: '0xabc' }]);
    expect(logger.warn).toHaveBeenCalledWith('[rampClient] normalized malformed response from listWallets', {
      issues: [{ code: 'too_small', path: '0.address' }],
      totalRows: 2,
    });
  });

  it('drops invalid cards without losing valid cards', async () => {
    get.mockResolvedValue({
      data: {
        cards: [
          { brand: CardBrand.Visa, id: '', lastFourDigits: '1111' },
          { brand: CardBrand.Mastercard, id: 'card-valid', lastFourDigits: '8990' },
        ],
      },
    });

    await expect(listCards({ trigger: 'signInScreen' })).resolves.toEqual([{ brand: 'Mastercard', id: 'card-valid', last4: '8990' }]);
  });

  it('reads an empty wallet list from an empty envelope', async () => {
    get.mockResolvedValue({ data: {} });

    await expect(listWallets()).resolves.toEqual([]);
  });
});
