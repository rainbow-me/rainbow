import { createBaseStore, createStoreActions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';
import { pendingTransactionsActions } from '@/state/pendingTransactions';

import { cashOrderService } from '../services/cashOrderService';
import { isTerminalOrderStatus, OrderFailureReason, OrderStatus, type BuyOrder, type BuyOrderSpec } from '../services/rampClient';
import { buildCashPurchaseTransaction } from '../utils/buildCashPurchaseTransaction';

export type CashBuyPhase = 'idle' | 'pending' | 'error' | 'success';
export type CashBuyErrorCode = 'PAYMENT_REJECTED' | 'GENERIC';

type CashBuyOrderState = {
  spec: BuyOrderSpec | null;
  order: BuyOrder | null;
  errorCode: CashBuyErrorCode | null;

  submitBuyOrder: (input: { depositAmount: string; walletAddress: string }) => Promise<void>;
  syncActiveOrder: (abortController?: AbortController) => Promise<void>;
  resumePendingSubmission: () => Promise<void>;
  reset: () => void;
};

const INITIAL_STATE = {
  spec: null,
  order: null,
  errorCode: null,
};

/**
 * Pure projection of the buy-order data fields onto a UI phase. Usable both inside the store
 * (`selectCashBuyPhase(get())`) and as a React selector (`useCashBuyOrderStore(selectCashBuyPhase)`).
 */
export function selectCashBuyPhase(state: Pick<CashBuyOrderState, 'spec' | 'order' | 'errorCode'>): CashBuyPhase {
  const { spec, order, errorCode } = state;
  if (errorCode) return 'error';
  if (spec !== null) {
    if (order === null) return 'pending';
    // Unreachable invariant: a spec and a resolved order should never coexist. The state is persisted,
    // so a migration/restore bug shouldn't white-screen render — log and treat the resolved order as success.
    logger.error(new RainbowError('[cashBuyOrderStore] Impossible state: order spec can not exist if order already exists'));
    return 'error';
  }
  // at this point spec is guaranteed to be null
  if (order === null) return 'idle';
  if (order.status === OrderStatus.Completed) return 'success';
  if (order.status === OrderStatus.Failed) return 'error';
  return 'pending';
}

export const useCashBuyOrderStore = createBaseStore<CashBuyOrderState>(
  (set, get) => {
    function applyTerminalOrder(order: BuyOrder): void {
      if (order.status === OrderStatus.Completed) {
        analytics.track(analytics.event.cashBuyOrderCompleted, {
          orderId: order.id,
          fiatAmount: order.fiatAmount.amount,
          fiatCurrency: order.fiatAmount.currency,
          cryptoAmount: order.cryptoAmount.amount,
          network: order.cryptoAmount.asset.network,
          timeToUsdcMs: new Date(order.completedTime).getTime() - new Date(order.createdTime).getTime(),
        });
        try {
          pendingTransactionsActions.addPendingTransaction({
            address: order.walletAddress,
            pendingTransaction: buildCashPurchaseTransaction({ order, walletAddress: order.walletAddress }),
          });
        } catch (error) {
          logger.error(new RainbowError('[cashBuyOrderStore] failed to enqueue purchase transaction', { error }), {
            orderId: order.id,
            transactionHash: order.transactionHash,
          });
        }
        set({ errorCode: null, order });
      } else if (order.status === OrderStatus.Failed) {
        const errorCode: CashBuyErrorCode = order.failureReason === OrderFailureReason.PaymentRejected ? 'PAYMENT_REJECTED' : 'GENERIC';
        analytics.track(analytics.event.cashBuyOrderFailed, { orderId: order.id, failureReason: order.failureReason, errorCode });
        set({ errorCode, order });
      }
    }

    async function submitBuyOrderSpec(orderSpec: BuyOrderSpec): Promise<void> {
      try {
        const order = await cashOrderService.createBuyOrder(orderSpec);
        set({ order, spec: null, errorCode: null });
      } catch (error) {
        logger.error(new RainbowError('[cashBuyOrderStore] createBuyOrder failed'), { error });
        analytics.track(analytics.event.cashBuyOrderFailed, { orderId: orderSpec.id, failureReason: null, errorCode: 'GENERIC' });
        set({ errorCode: 'GENERIC', order: null, spec: null });
      }
    }

    return {
      ...INITIAL_STATE,

      submitBuyOrder: async ({ depositAmount, walletAddress }) => {
        if (selectCashBuyPhase(get()) === 'pending') return;

        analytics.track(analytics.event.cashBuyOrderSubmitted, { amount: depositAmount });

        const orderSpec = cashOrderService.createBuyOrderSpec({ depositAmount, walletAddress });
        set({ spec: orderSpec, order: null, errorCode: null });
        await submitBuyOrderSpec(orderSpec);
      },

      syncActiveOrder: async abortController => {
        const { order } = get();
        if (selectCashBuyPhase(get()) !== 'pending' || !order || isTerminalOrderStatus(order.status)) return;
        if (abortController?.signal.aborted || get().order?.id !== order.id) return;

        try {
          const next = await cashOrderService.getOrder(order.id);
          if (isTerminalOrderStatus(next.status)) {
            applyTerminalOrder(next);
          } else {
            set({ order: next });
          }
        } catch (error) {
          // Transient poll failure; retry on the watcher's next tick.
          logger.error(new RainbowError('[cashBuyOrderStore] getOrder failed'), { error });
        }
      },

      resumePendingSubmission: async () => {
        const { spec: orderSpec } = get();
        if (orderSpec !== null) await submitBuyOrderSpec(orderSpec);
      },

      reset: () => set({ ...INITIAL_STATE }),
    };
  },
  {
    storageKey: 'cashBuyOrder',
    version: 0,
    // Flush the submit intent on the next tick rather than the default 3-5s debounce, so a kill shortly
    // after submit can still be recovered. (Not a hard guarantee: a same-frame crash can still beat it.)
    persistThrottleMs: 0,
    // Persist only the fail-recovery fields, dropping the transient `errorCode`:
    // - `spec` is needed if the app fails during spec submission, before we know whether the order
    //   reached the backend — on restart we replay it (idempotently) via `resumePendingSubmission`.
    // - `order` is needed if the app fails after the order is created but before it resolves to a
    //   success status carrying a `transactionHash` — on restart we keep polling it to terminal status.
    partialize: state => ({ spec: state.spec, order: state.order }),
  }
);

export const cashBuyOrderActions = createStoreActions(useCashBuyOrderStore);

export const useCashBuyPhase = () => useCashBuyOrderStore(selectCashBuyPhase);
