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

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === OrderStatus.Completed || status === OrderStatus.Failed;
}

// ---- Request / response shapes ---------------------------------------------

export type RampAsset = { asset: RampCryptoAsset; network: RampNetwork };
export type CryptoAmount = { amount: string; asset: RampAsset };
export type FiatAmount = { amount: string; currency: string };

export type BuyOrderSpec = {
  /** Fiat amount as a decimal string, e.g. "50". */
  depositAmount: string;
  /** Client-generated order id. The backend adopts it as the order's id; a replay with the same id is idempotent (returns the existing order's status, never re-creates). */
  id: string;
  walletAddress: string;
};

export type CreateBuyOrderParams = BuyOrderSpec & {
  cardId: string;
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
