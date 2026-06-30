import { useCashMockOrderOutcomeStore } from '@/features/cash/stores/cashMockOrderOutcomeStore';

import {
  OrderFailureReason,
  OrderStatus,
  RampError,
  type BuyOrder,
  type CreateBuyOrderParams,
  type RampAsset,
  type RampClient,
} from './rampClient';

export type MockRampScenario = 'success' | 'orderFailure';

const SUCCESS_PATH: readonly OrderStatus[] = [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Processing, OrderStatus.Completed];
const FAILURE_PATH: readonly OrderStatus[] = [OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Failed];

type MockOrderRecord = {
  completedTime?: string;
  createdTime: string;
  cryptoAsset: RampAsset;
  depositAmount: string;
  path: readonly OrderStatus[];
  step: number;
  walletAddress: string;
};

export type MockRampClientConfig = {
  getScenario?: () => MockRampScenario;
};

/** In-memory `RampClient`. `getOrder` advances one scripted step per call. */
export class MockRampClient implements RampClient {
  private readonly getScenario: () => MockRampScenario;
  private readonly orders = new Map<string, MockOrderRecord>();

  constructor(config: MockRampClientConfig = {}) {
    this.getScenario = config.getScenario ?? (() => 'success');
  }

  createBuyOrder(params: CreateBuyOrderParams): Promise<BuyOrder> {
    // The client owns the id; a replay with a known id returns that order at its current step, never re-creating.
    if (this.orders.has(params.id)) return Promise.resolve(this.toBuyOrder(params.id));

    const path = this.getScenario() === 'orderFailure' ? FAILURE_PATH : SUCCESS_PATH;
    this.orders.set(params.id, {
      createdTime: new Date().toISOString(),
      cryptoAsset: params.cryptoAsset,
      depositAmount: params.depositAmount,
      path,
      step: 0,
      walletAddress: params.walletAddress,
    });
    return Promise.resolve(this.toBuyOrder(params.id));
  }

  getOrder(orderId: string): Promise<BuyOrder> {
    const record = this.orders.get(orderId);
    if (!record) return Promise.reject(new RampError(`Unknown order ${orderId}`));
    if (record.step < record.path.length - 1) record.step += 1;
    return Promise.resolve(this.toBuyOrder(orderId));
  }

  private toBuyOrder(orderId: string): BuyOrder {
    const record = this.orders.get(orderId);
    if (!record) throw new RampError(`Unknown order ${orderId}`);
    const fiatAmount = { amount: record.depositAmount, currency: 'USD' };
    // Mock treats USDC as 1:1 with USD; the real backend returns the quoted crypto amount.
    const cryptoAmount = { amount: record.depositAmount, asset: record.cryptoAsset };
    const common = { id: orderId, cryptoAmount, fiatAmount, walletAddress: record.walletAddress, createdTime: record.createdTime };
    const status = record.path[record.step];
    switch (status) {
      case OrderStatus.Failed:
        return { ...common, status, failureReason: OrderFailureReason.PaymentRejected };
      case OrderStatus.Completed:
        record.completedTime ??= new Date().toISOString();
        return { ...common, status, transactionHash: `mock-tx-${orderId}`, completedTime: record.completedTime };
      case OrderStatus.Processing:
        return { ...common, status };
      default:
        return { ...common, status: OrderStatus.Pending };
    }
  }
}

export const mockRampClient = new MockRampClient({
  getScenario: () => (useCashMockOrderOutcomeStore.getState().outcome === 'fail' ? 'orderFailure' : 'success'),
});
