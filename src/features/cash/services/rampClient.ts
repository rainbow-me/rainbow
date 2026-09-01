import { IS_TESTING } from 'react-native-dotenv';

import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { useCashAuthTokenStore } from '../stores/cashAuthTokenStore';
import type { LinkedCard } from '../stores/cashPaymentMethodStore';
import { buildAuthenticatedHeader, getCashPlatformClient } from './cashPlatformClient';
import { ensureAccessToken, type CashSignInTrigger } from './cashSignInService';

// ---- Wire enums (values mirror the platform `/v1/ramp` OpenAPI spec) --------

export enum OrderStatus {
  Unspecified = 'ORDER_STATUS_UNSPECIFIED',
  Pending = 'ORDER_STATUS_PENDING',
  Processing = 'ORDER_STATUS_PROCESSING',
  Completed = 'ORDER_STATUS_COMPLETED',
  Failed = 'ORDER_STATUS_FAILED',
}

export enum OrderFailureReason {
  Unspecified = 'ORDER_FAILURE_REASON_UNSPECIFIED',
  PaymentRejected = 'ORDER_FAILURE_REASON_PAYMENT_REJECTED',
}

export enum RampCryptoAsset {
  Unspecified = 'CRYPTO_ASSET_UNSPECIFIED',
  USDC = 'CRYPTO_ASSET_USDC',
}

export enum RampNetwork {
  Unspecified = 'NETWORK_UNSPECIFIED',
  ArbitrumTestnet = 'NETWORK_ARBITRUM_TESTNET',
  Base = 'NETWORK_BASE',
}

export enum CardBrand {
  Unspecified = 'CARD_BRAND_UNSPECIFIED',
  Visa = 'CARD_BRAND_VISA',
  Mastercard = 'CARD_BRAND_MASTERCARD',
  Amex = 'CARD_BRAND_AMEX',
  Discover = 'CARD_BRAND_DISCOVER',
}

export enum WalletSignatureMethod {
  Unspecified = 'WALLET_SIGNATURE_METHOD_UNSPECIFIED',
  EthPersonalSign = 'WALLET_SIGNATURE_METHOD_ETH_PERSONAL_SIGN',
}

// ---- Request / response shapes ---------------------------------------------

export type RampAsset = { asset: RampCryptoAsset; network: RampNetwork };
export type CryptoAmount = { amount: string; asset: RampAsset };
export type FiatAmount = { amount: string; currency: string };

export type BuyOrderSpec = {
  cardId: string;
  /** Fiat amount as a decimal string, e.g. "50". */
  depositAmount: string;
  /** Client-generated UUID. The backend adopts it as the order's id; a replay with the same id is idempotent (returns the existing order's status, never re-creates). */
  id: string;
  walletAddress: string;
};

export type CreateBuyOrderParams = BuyOrderSpec & {
  cryptoAsset: RampAsset;
};

export type CreatedBuyOrder = {
  id: string;
  status: OrderStatus;
  createdTime: string;
};

type BuyOrderCommon = {
  id: string;
  cryptoAmount: CryptoAmount;
  fiatAmount: FiatAmount;
  /** ISO 8601 timestamp of when the order was created. */
  createdTime: string;
  walletAddress: string;
};

export type BuyOrder =
  | (BuyOrderCommon & { status: OrderStatus.Pending })
  | (BuyOrderCommon & { status: OrderStatus.Processing })
  | (BuyOrderCommon & { status: OrderStatus.Completed; transactionHash: string; completedTime: string })
  | (BuyOrderCommon & { status: OrderStatus.Failed; failureReason: OrderFailureReason });

export type TerminalBuyOrder = Extract<BuyOrder, { status: OrderStatus.Completed | OrderStatus.Failed }>;

export function isTerminalBuyOrder(order: BuyOrder): order is TerminalBuyOrder {
  return order.status === OrderStatus.Completed || order.status === OrderStatus.Failed;
}

export class RampError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RampError';
  }
}

// ---- Card link session -----------------------------------------------------

type StartCardLinkSessionResponse = { linkUrl: string; token: string; tokenExpiresTime: string };

type RampCard = {
  brand: CardBrand;
  id: string;
  lastFourDigits: string;
  createdTime: string;
};

type CompleteCardLinkSessionRequest = { providerCardId: string; brand: CardBrand };
type CompleteCardLinkSessionResponse = { card: RampCard };

type ListCardsResponse = { cards?: RampCard[] };

const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  [CardBrand.Unspecified]: 'Card',
  [CardBrand.Visa]: 'Visa',
  [CardBrand.Mastercard]: 'Mastercard',
  [CardBrand.Amex]: 'American Express',
  [CardBrand.Discover]: 'Discover',
};

function toLinkedCard({ brand, id, lastFourDigits }: RampCard): LinkedCard {
  return { id, brand: CARD_BRAND_LABELS[brand], last4: lastFourDigits };
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof RainbowFetchError && error.response?.status === 401;
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof RainbowFetchError && error.response?.status === 404;
}

/** The backend answered and refused, so the request definitively took no effect. Timeouts, rate limits, transport failures, and 5xx stay ambiguous. */
export function isDefinitiveRejection(error: unknown): boolean {
  const status = error instanceof RainbowFetchError ? error.response?.status : undefined;
  return status !== undefined && status >= 400 && status < 500 && status !== 408 && status !== 429;
}

// The user JWT replaces the shared app key on these calls. On 401 the cached
// token is assumed stale: drop it, run one fresh sign-in ceremony, retry once.
// Tokens are acquired outside the try so a 401 from the ceremony's own RPCs
// propagates instead of triggering a second ceremony.
async function authorizedRequest<T>(trigger: CashSignInTrigger, send: (headers: { Authorization: string }) => Promise<T>): Promise<T> {
  const headers = buildAuthenticatedHeader(await ensureAccessToken(trigger));
  try {
    return await send(headers);
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    useCashAuthTokenStore.getState().clearToken();
    return send(buildAuthenticatedHeader(await ensureAccessToken(trigger)));
  }
}

export async function startCardLinkSession(abortController?: AbortController | null): Promise<StartCardLinkSessionResponse> {
  const { data } = await authorizedRequest('cardLink', headers =>
    getCashPlatformClient().post<StartCardLinkSessionResponse>('/ramp/payment-methods/link-card-session', {}, { abortController, headers })
  );
  return data;
}

export async function completeCardLinkSession(
  { providerCardId, brand }: CompleteCardLinkSessionRequest,
  abortController?: AbortController | null
): Promise<LinkedCard> {
  const { data } = await authorizedRequest('cardLink', headers =>
    getCashPlatformClient().post<CompleteCardLinkSessionResponse>(
      '/ramp/payment-methods/link-card-session/complete',
      {
        brand,
        providerCardId,
      },
      { abortController, headers }
    )
  );
  return toLinkedCard(data.card);
}

export async function listCards({
  abortController,
  trigger,
}: {
  abortController?: AbortController | null;
  trigger: CashSignInTrigger;
}): Promise<LinkedCard[]> {
  if (IS_TESTING === 'true') return [];

  const { data } = await authorizedRequest(trigger, headers =>
    getCashPlatformClient().get<ListCardsResponse>('/ramp/payment-methods/cards', { abortController, headers })
  );
  // protojson drops empty repeated fields, so an account with no cards responds `{}`.
  return (data.cards ?? []).map(toLinkedCard);
}

export async function deleteCard(cardId: string, abortController?: AbortController | null): Promise<void> {
  await authorizedRequest('addCash', headers =>
    getCashPlatformClient().delete(`/ramp/payment-methods/${encodeURIComponent(cardId)}`, { abortController, headers })
  );
}

// ---- Wallet link -----------------------------------------------------------

export type RampWallet = { id: string; address: string };

export type WalletSignature = {
  /** EIP-191 signature of the link message, 0x-prefixed. */
  hexSignature: string;
  method: WalletSignatureMethod;
  /** Unix seconds as a string (the wire type is int64). Must equal the timestamp inside the signed message. */
  timestamp: string;
};

type ListWalletsResponse = { wallets?: RampWallet[] };

type LinkWalletResponse = { wallet: RampWallet };

export async function listWallets(abortController?: AbortController | null): Promise<RampWallet[]> {
  const { data } = await authorizedRequest('addCash', headers =>
    getCashPlatformClient().get<ListWalletsResponse>('/ramp/wallets', { abortController, headers })
  );
  // protojson drops empty repeated fields, so an account with no wallets responds `{}`.
  return data.wallets ?? [];
}

export async function linkWallet(
  { address, signature }: { address: string; signature: WalletSignature },
  abortController?: AbortController | null
): Promise<RampWallet> {
  const { data } = await authorizedRequest('addCash', headers =>
    getCashPlatformClient().post<LinkWalletResponse>('/ramp/wallets/link', { address, signature }, { abortController, headers })
  );
  return data.wallet;
}

// ---- Buy orders ------------------------------------------------------------

type GetOrderResponse = { order: BuyOrder };

export async function createBuyOrder(params: CreateBuyOrderParams): Promise<CreatedBuyOrder> {
  if (IS_TESTING === 'true') return e2eCreateBuyOrder(params);

  const { data } = await authorizedRequest('addCash', headers =>
    getCashPlatformClient().post<CreatedBuyOrder>('/ramp/orders/buy', params, { headers })
  );
  return data;
}

export async function getOrder(orderId: string, abortController?: AbortController | null): Promise<BuyOrder> {
  if (IS_TESTING === 'true') return e2eGetOrder(orderId);

  const { data } = await authorizedRequest('addCash', headers =>
    getCashPlatformClient().get<GetOrderResponse>(`/ramp/orders/${encodeURIComponent(orderId)}`, { abortController, headers })
  );
  return data.order;
}

// ---- E2E buy orders ----------------------------------------------------------
// In-memory stand-in for the two order endpoints: `getOrder` advances one scripted
// step per call, and a `createBuyOrder` replay with a known id returns the existing
// order without re-creating — mirroring the backend's idempotency contract.

const E2E_ORDER_PATH = [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Processing, OrderStatus.Completed] as const;

type E2EOrderRecord = {
  completedTime?: string;
  createdTime: string;
  cryptoAsset: RampAsset;
  depositAmount: string;
  step: number;
  walletAddress: string;
};

const e2eOrders = new Map<string, E2EOrderRecord>();

function e2eCreateBuyOrder(params: CreateBuyOrderParams): CreatedBuyOrder {
  let record = e2eOrders.get(params.id);
  if (!record) {
    record = {
      createdTime: new Date().toISOString(),
      cryptoAsset: params.cryptoAsset,
      depositAmount: params.depositAmount,
      step: 0,
      walletAddress: params.walletAddress,
    };
    e2eOrders.set(params.id, record);
  }
  return { id: params.id, status: E2E_ORDER_PATH[record.step], createdTime: record.createdTime };
}

function e2eGetOrder(orderId: string): BuyOrder {
  const record = e2eOrders.get(orderId);
  if (!record) throw new RampError(`Unknown order ${orderId}`);
  if (record.step < E2E_ORDER_PATH.length - 1) record.step += 1;

  const common = {
    id: orderId,
    // E2E treats USDC as 1:1 with USD; the real backend returns the quoted crypto amount.
    cryptoAmount: { amount: record.depositAmount, asset: record.cryptoAsset },
    fiatAmount: { amount: record.depositAmount, currency: 'USD' },
    createdTime: record.createdTime,
    walletAddress: record.walletAddress,
  };
  const status = E2E_ORDER_PATH[record.step];
  switch (status) {
    case OrderStatus.Completed:
      record.completedTime ??= new Date().toISOString();
      return { ...common, status, transactionHash: `mock-tx-${orderId}`, completedTime: record.completedTime };
    case OrderStatus.Processing:
      return { ...common, status };
    default:
      return { ...common, status: OrderStatus.Pending };
  }
}
