import { createBaseStore, createStoreActions } from '@storesjs/stores';
import { v4 as uuidv4 } from 'uuid';

import { analytics } from '@/analytics';
import { toAnalyticsAmount } from '@/analytics/utils';
import { requireAddress } from '@/features/address/core/requireAddress';
import { logger, RainbowError } from '@/logger';
import { pendingTransactionsActions } from '@/state/pendingTransactions';

import { CASH_BUY_DESTINATION_ASSET } from '../constants';
import {
  createBuyOrder,
  getOrder,
  isDefinitiveRejection,
  isNotFoundError,
  isTerminalBuyOrder,
  OrderFailureReason,
  OrderStatus,
  type BuyOrder,
  type BuyOrderSpec,
  type TerminalBuyOrder,
} from '../services/rampClient';
import { buildCashPurchaseTransaction } from '../utils/buildCashPurchaseTransaction';
import { useCashWalletStore } from './cashWalletStore';

export type CashBuyPhase = 'idle' | 'pending' | 'error' | 'success';
export type CashBuyErrorCode = 'PAYMENT_REJECTED' | 'GENERIC';

export type CashBuyStatus =
  | { step: 'idle' }
  | {
      /** A submit is in flight: the spec has not (knowably) reached the backend yet. */
      step: 'submitting';
      spec: BuyOrderSpec;
      /** Epoch ms of the submit, anchoring "how long has this order been pending". */
      submittedAt: number;
    }
  | {
      /** The order exists on the backend; `order` stays null until the first successful details fetch. */
      step: 'polling';
      orderId: string;
      order: Exclude<BuyOrder, TerminalBuyOrder> | null;
      submittedAt: number;
    }
  | { step: 'success'; order: Extract<BuyOrder, { status: OrderStatus.Completed }> }
  | {
      step: 'error';
      errorCode: CashBuyErrorCode;
      order: Extract<BuyOrder, { status: OrderStatus.Failed }> | null;
      /**
       * Retained when the submit failed ambiguously (the order may still exist under this id), so a
       * retry with the same inputs replays the same id instead of risking a second order. Absent when
       * the backend definitively rejected the create or the order itself reached a terminal failure.
       */
      spec?: BuyOrderSpec;
    };

type CashBuyOrderState = {
  status: CashBuyStatus;

  submitBuyOrder: (input: Omit<BuyOrderSpec, 'id'>) => Promise<void>;
  syncActiveOrder: (abortController?: AbortController) => Promise<void>;
  resumePendingSubmission: () => Promise<void>;
  reset: () => void;
};

const PHASE_BY_STEP: Record<CashBuyStatus['step'], CashBuyPhase> = {
  idle: 'idle',
  submitting: 'pending',
  polling: 'pending',
  success: 'success',
  error: 'error',
};

/**
 * Projection of the buy-order status onto a UI phase. Usable both inside the store
 * (`selectCashBuyPhase(get())`) and as a React selector (`useCashBuyOrderStore(selectCashBuyPhase)`).
 */
export function selectCashBuyPhase(state: Pick<CashBuyOrderState, 'status'>): CashBuyPhase {
  return PHASE_BY_STEP[state.status.step];
}

export const useCashBuyOrderStore = createBaseStore<CashBuyOrderState>(
  (set, get) => {
    function applyTerminalOrder(order: TerminalBuyOrder): void {
      if (order.status === OrderStatus.Completed) {
        const { completedTime, createdTime, cryptoAmount, fiatAmount } = order;
        if (cryptoAmount && fiatAmount && createdTime !== undefined && completedTime !== undefined) {
          analytics.track(analytics.event.cashBuyOrderCompleted, {
            fiatAmount: toAnalyticsAmount(fiatAmount.amount),
            fiatCurrency: fiatAmount.currency,
            cryptoAmount: toAnalyticsAmount(cryptoAmount.amount),
            network: cryptoAmount.asset.network,
            timeToUsdcMs: completedTime - createdTime,
          });
        }
        try {
          const walletAddress = requireAddress(order.walletAddress, '[cashBuyOrderStore] ramp returned an invalid wallet address');
          pendingTransactionsActions.addPendingTransaction({
            address: walletAddress,
            pendingTransaction: buildCashPurchaseTransaction({ order, walletAddress }),
          });
        } catch (error) {
          logger.error(new RainbowError('[cashBuyOrderStore] failed to enqueue purchase transaction', error), {
            orderId: order.id,
            transactionHash: order.transactionHash,
          });
        }
        set({ status: { step: 'success', order } });
      } else if (order.status === OrderStatus.Failed) {
        const errorCode: CashBuyErrorCode = order.failureReason === OrderFailureReason.PaymentRejected ? 'PAYMENT_REJECTED' : 'GENERIC';
        analytics.track(analytics.event.cashBuyOrderFailed, { orderId: order.id, failureReason: order.failureReason, errorCode });
        set({ status: { step: 'error', errorCode, order } });
      }
    }

    // The same spec can be in flight more than once (a reopen replays it while the original POST
    // still runs), so a result only lands while the store is still submitting that spec — whichever
    // settles first wins, the straggler is dropped.
    function isCurrentSubmission(spec: BuyOrderSpec): boolean {
      const current = get().status;
      return current.step === 'submitting' && current.spec.id === spec.id;
    }

    async function submitBuyOrderSpec({ spec, submittedAt }: { spec: BuyOrderSpec; submittedAt: number }): Promise<void> {
      try {
        await createBuyOrder({ ...spec, cryptoAsset: CASH_BUY_DESTINATION_ASSET });
        if (!isCurrentSubmission(spec)) return;
        set({ status: { step: 'polling', orderId: spec.id, order: null, submittedAt } });
      } catch (error) {
        if (!isCurrentSubmission(spec)) return;
        logger.error(new RainbowError('[cashBuyOrderStore] createBuyOrder failed', error));
        analytics.track(analytics.event.cashBuyOrderFailed, { orderId: spec.id, failureReason: null, errorCode: 'GENERIC' });
        set({ status: { step: 'error', errorCode: 'GENERIC', order: null, spec: isDefinitiveRejection(error) ? undefined : spec } });
        // A 404 says the backend did not recognise something this order named, and the linked wallet
        // is the part of that we cache — persisted, so a stale entry would fail every retry. Dropping
        // it costs the next attempt one GET and lets that attempt gate on the truth; absence only
        // ever means "ask the server".
        if (isNotFoundError(error)) useCashWalletStore.getState().clear();
      }
    }

    return {
      status: { step: 'idle' },

      submitBuyOrder: async ({ cardId, depositAmount, walletAddress }) => {
        const { status } = get();
        if (selectCashBuyPhase({ status }) === 'pending') return;

        analytics.track(analytics.event.cashBuyOrderSubmitted, { amount: toAnalyticsAmount(depositAmount) });

        // decides whether the new submission should reuse the order id
        // from a previous failed attempt with not definitive rejection
        const retained =
          status.step === 'error' &&
          status.spec?.cardId === cardId &&
          status.spec.depositAmount === depositAmount &&
          status.spec.walletAddress === walletAddress
            ? status.spec
            : null;
        const submitting = {
          step: 'submitting',
          spec: retained ?? { cardId, depositAmount, walletAddress, id: uuidv4() },
          submittedAt: Date.now(),
        } as const;
        set({ status: submitting });
        await submitBuyOrderSpec(submitting);
      },

      syncActiveOrder: async abortController => {
        const { status } = get();
        if (status.step !== 'polling' || abortController?.signal.aborted) return;
        const { orderId } = status;

        // rainbowFetch arms its 30s timeout on the controller it is handed, so the watcher's
        // long-lived controller must never reach it directly — one hung request would abort the
        // whole poll loop. A request-scoped controller confines the timeout to this tick.
        const requestController = new AbortController();
        const propagateAbort = () => requestController.abort();
        abortController?.signal.addEventListener('abort', propagateAbort);
        try {
          const next = await getOrder(orderId, requestController);
          if (abortController?.signal.aborted) return;
          const current = get().status;
          if (current.step !== 'polling' || current.orderId !== orderId) return;
          if (isTerminalBuyOrder(next)) {
            applyTerminalOrder(next);
          } else {
            set({ status: { ...current, order: next } });
          }
        } catch (error) {
          if (abortController?.signal.aborted) return;
          throw error;
        } finally {
          abortController?.signal.removeEventListener('abort', propagateAbort);
        }
      },

      resumePendingSubmission: async () => {
        const { status } = get();
        if (status.step === 'submitting') await submitBuyOrderSpec(status);
      },

      reset: () => set({ status: { step: 'idle' } }),
    };
  },
  {
    storageKey: 'cashBuyOrder',
    version: 1,
    // Flush the submit intent on the next tick rather than the default 3-5s debounce, so a kill shortly
    // after submit can still be recovered. (Not a hard guarantee: a same-frame crash can still beat it.)
    persistThrottleMs: 0,
    // Persist only the in-flight steps — the ones worth recovering after a kill:
    // - 'submitting' is replayed (idempotently) via `resumePendingSubmission` on the next Add Cash open,
    //   since we don't know whether the spec reached the backend.
    // - 'polling' resumes on the next Add Cash open, so the success status carrying a `transactionHash`
    //   is not lost.
    // Terminal states collapse to idle: the sheet resets them on open anyway.
    partialize: state => ({
      status: state.status.step === 'submitting' || state.status.step === 'polling' ? state.status : { step: 'idle' as const },
    }),
  }
);

export const cashBuyOrderActions = createStoreActions(useCashBuyOrderStore);

export const useCashBuyPhase = () => useCashBuyOrderStore(selectCashBuyPhase);
