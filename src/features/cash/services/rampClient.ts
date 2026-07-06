import { CASH_PLATFORM_API_KEY, CASH_PLATFORM_BASE_URL } from 'react-native-dotenv';

import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';

import type { LinkedCard } from '../stores/cashPaymentMethodStore';

let platformClient: RainbowFetchClient | undefined;

// TODO: replace with src/resources/platform/client.ts
// once cash related backend is completely deployed to production
export function getCashPlatformClient(): RainbowFetchClient {
  return (platformClient ??= new RainbowFetchClient({
    baseURL: `${CASH_PLATFORM_BASE_URL}/v1`,
    headers: {
      Authorization: `Bearer ${CASH_PLATFORM_API_KEY}`,
    },
  }));
}

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

type RampPaymentMethod = {
  id: string;
  type: 'PAYMENT_METHOD_TYPE_CARD';
  card: {
    brand: CardBrand;
    // Only the last 4 digits, despite the name — the backend returns no mask characters.
    maskedNumber: string;
  };
  createdTime: string;
};

type CompleteCardLinkSessionResponse = { paymentMethod: RampPaymentMethod };

const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  [CardBrand.Unspecified]: 'Card',
  [CardBrand.Visa]: 'Visa',
  [CardBrand.Mastercard]: 'Mastercard',
};

export async function startCardLinkSession(abortController?: AbortController | null): Promise<StartCardLinkSessionResponse> {
  const { data } = await getCashPlatformClient().post<StartCardLinkSessionResponse>(
    '/ramp/payment-methods/link-card-session',
    {},
    { abortController }
  );
  return data;
}

export async function completeCardLinkSession(
  { providerCardId }: { providerCardId: string },
  abortController?: AbortController | null
): Promise<LinkedCard> {
  const { data } = await getCashPlatformClient().post<CompleteCardLinkSessionResponse>(
    '/ramp/payment-methods/link-card-session/complete',
    {
      providerCardId,
    },
    { abortController }
  );
  const { id, card } = data.paymentMethod;
  return { id, brand: CARD_BRAND_LABELS[card.brand], last4: card.maskedNumber };
}
