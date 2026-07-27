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
  Base = 'NETWORK_BASE',
}

export enum CardBrand {
  Unspecified = 'CARD_BRAND_UNSPECIFIED',
  Visa = 'CARD_BRAND_VISA',
  Mastercard = 'CARD_BRAND_MASTERCARD',
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === OrderStatus.Completed || status === OrderStatus.Failed;
}

// ---- Request / response shapes ---------------------------------------------

export type RampAsset = { asset: RampCryptoAsset; network: RampNetwork };
export type CryptoAmount = { amount: string; asset: RampAsset };
export type FiatAmount = { amount: string; currency: string };

export type BuyOrderSpec = {
  cardId: string;
  /** Fiat amount as a decimal string, e.g. "50". */
  depositAmount: string;
  /** Client-generated order id. The backend adopts it as the order's id; a replay with the same id is idempotent (returns the existing order's status, never re-creates). */
  id: string;
  walletAddress: string;
};

export type CreateBuyOrderParams = BuyOrderSpec & {
  cryptoAsset: RampAsset;
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

export class RampError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RampError';
  }
}

/**
 * The seam over the platform `/v1/ramp/orders/*` surface.
 */
export interface RampClient {
  createBuyOrder(params: CreateBuyOrderParams): Promise<BuyOrder>;
  getOrder(orderId: string): Promise<BuyOrder>;
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
