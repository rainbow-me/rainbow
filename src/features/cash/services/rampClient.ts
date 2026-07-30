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
  Arbitrum = 'NETWORK_ARBITRUM',
  ArbitrumTestnet = 'NETWORK_ARBITRUM_TESTNET',
  Base = 'NETWORK_BASE',
}

export enum CardBrand {
  Unspecified = 'CARD_BRAND_UNSPECIFIED',
  Visa = 'CARD_BRAND_VISA',
  Mastercard = 'CARD_BRAND_MASTERCARD',
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
  id: string;
  lastFourDigits: string;
  createdTime: string;
};

type CompleteCardLinkSessionResponse = { card: RampCard };

const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  [CardBrand.Unspecified]: 'Card',
  [CardBrand.Visa]: 'Visa',
  [CardBrand.Mastercard]: 'Mastercard',
};

function isUnauthorized(error: unknown): boolean {
  return error instanceof RainbowFetchError && error.response?.status === 401;
}

export function isNotFoundError(error: unknown): boolean {
  return error instanceof RainbowFetchError && error.response?.status === 404;
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
  { providerCardId }: { providerCardId: string },
  abortController?: AbortController | null
): Promise<LinkedCard> {
  const { data } = await authorizedRequest('cardLink', headers =>
    getCashPlatformClient().post<CompleteCardLinkSessionResponse>(
      '/ramp/payment-methods/link-card-session/complete',
      {
        providerCardId,
      },
      { abortController, headers }
    )
  );
  const { id, lastFourDigits } = data.card;
  // TODO: Replace it with actual CC brands once APP-3934 is resolved
  return { id, brand: CARD_BRAND_LABELS[CardBrand.Visa], last4: lastFourDigits };
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
  const { data } = await authorizedRequest('addCash', headers =>
    getCashPlatformClient().post<CreatedBuyOrder>('/ramp/orders/buy', params, { headers })
  );
  return data;
}

export async function getOrder(orderId: string, abortController?: AbortController | null): Promise<BuyOrder> {
  const { data } = await authorizedRequest('addCash', headers =>
    getCashPlatformClient().get<GetOrderResponse>(`/ramp/orders/${encodeURIComponent(orderId)}`, { abortController, headers })
  );
  return data.order;
}
