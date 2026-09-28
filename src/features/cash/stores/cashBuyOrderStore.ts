import { createBaseStore, createStoreActions } from '@storesjs/stores';
import { v4 as uuidv4 } from 'uuid';

import { analytics } from '@/analytics';
import { toAnalyticsAmount } from '@/analytics/utils';
import { requireAddress } from '@/features/address/core/requireAddress';
import { logger, RainbowError } from '@/logger';
import { pendingTransactionsActions } from '@/state/pendingTransactions';
import { delay } from '@/utils/delay';

import { CASH_BUY_DESTINATION_ASSET, ORDER_SUBMISSION_MAX_REPLAYS, ORDER_SUBMISSION_REPLAY_BASE_DELAY_MS } from '../constants';
import { isCashAccessRefusedError } from '../services/cashAccessRefusal';
import { isPasskeyCancellation } from '../services/cashPasskeyService';
import {
  createBuyOrder,
  getOrderWithCachedAuth,
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
import { useCashAuthGateStore } from './cashAuthGateStore';
import { useCashWalletStore } from './cashWalletStore';

export type CashBuyPhase = 'idle' | 'pending' | 'error' | 'success';
export type CashBuyErrorCode = 'PAYMENT_REJECTED' | 'GENERIC';

type CashBuyResumeResult = 'completed' | 'authRequired';

type UnresolvedSubmission = {
  spec: BuyOrderSpec;
  /** Epoch ms of the submit, anchoring "how long has this order been pending". */
  submittedAt: number;
};

export type CashBuyStatus =
  | { step: 'idle' }
  | { step: 'accessRefused'; spec: BuyOrderSpec }
  /** A submit is in flight: the spec has not (knowably) reached the backend yet. */
  | ({ step: 'submitting' } & UnresolvedSubmission)
  /** Whether the submit landed is unknown, so the order is read back under its id rather than written again. */
  | ({ step: 'probing' } & UnresolvedSubmission)
  /** The read could not answer either; deposits stay paused until a definitive one does. */
  | ({ step: 'paused' } & UnresolvedSubmission)
  | {
      /** The order exists on the backend; `order` stays null until the first successful details fetch. */
      step: 'polling';
      orderId: string;
      order: Exclude<BuyOrder, TerminalBuyOrder> | null;
      submittedAt: number;
    }
  | { step: 'success'; order: Extract<BuyOrder, { status: OrderStatus.Completed }> }
  /**
   * The backend has no order under this id, so nothing was charged. The spec is kept so a retry
   * with the same inputs still replays the same id instead of risking a second order.
   */
  | { step: 'notPlaced'; spec: BuyOrderSpec }
  | { step: 'error'; errorCode: CashBuyErrorCode; order: Extract<BuyOrder, { status: OrderStatus.Failed }> | null };

type CashBuyOrderState = {
  status: CashBuyStatus;

  submitBuyOrder: (input: Omit<BuyOrderSpec, 'id'>) => Promise<void>;
  syncActiveOrder: (abortController?: AbortController) => Promise<void>;
  resumeOrder: () => Promise<CashBuyResumeResult>;
  suspendSubmission: () => void;
  reset: () => void;
};

const PHASE_BY_STEP: Record<CashBuyStatus['step'], CashBuyPhase> = {
  idle: 'idle',
  accessRefused: 'idle',
  submitting: 'pending',
  probing: 'pending',
  paused: 'pending',
  polling: 'pending',
  success: 'success',
  notPlaced: 'error',
  error: 'error',
};

/**
 * Projection of the buy-order status onto a UI phase. Usable both inside the store
 * (`selectCashBuyPhase(get())`) and as a React selector (`useCashBuyOrderStore(selectCashBuyPhase)`).
 */
export function selectCashBuyPhase(state: Pick<CashBuyOrderState, 'status'>): CashBuyPhase {
  return PHASE_BY_STEP[state.status.step];
}

// Automatic requests never run the sign-in ceremony: auth loss parks the sheet's gate, and the
// user's Re-authenticate tap resumes the order from wherever it stopped.
function parkForReauth(): void {
  useCashAuthGateStore.getState().park({ kind: 'resumeOrder' });
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

    let pendingProbe: { spec: BuyOrderSpec; promise: Promise<CashBuyResumeResult> } | null = null;

    async function runProbe(probing: Extract<CashBuyStatus, { step: 'probing' }>): Promise<CashBuyResumeResult> {
      const { spec, submittedAt } = probing;
      set({ status: probing });
      try {
        const result = await getOrderWithCachedAuth(spec.id);
        const current = get().status;
        if (result.kind === 'authRequired') return current === probing ? 'authRequired' : 'completed';
        if (current.step === 'polling') {
          if (current.orderId !== spec.id || (!isTerminalBuyOrder(result.data) && current.order !== null)) return 'completed';
        } else if (!('spec' in current) || current.spec !== spec) {
          return 'completed';
        }
        if (isTerminalBuyOrder(result.data)) applyTerminalOrder(result.data);
        else set({ status: { step: 'polling', orderId: spec.id, order: result.data, submittedAt } });
      } catch (error) {
        if (get().status !== probing) return 'completed';
        if (isNotFoundError(error)) {
          set({ status: { step: 'notPlaced', spec } });
        } else {
          logger.error(new RainbowError('[cashBuyOrderStore] buy order left unconfirmed', error), { orderId: spec.id });
          set({ status: { step: 'paused', spec, submittedAt } });
        }
      }
      return 'completed';
    }

    function probeOrder(probing: Extract<CashBuyStatus, { step: 'probing' }>): Promise<CashBuyResumeResult> {
      if (pendingProbe?.spec === probing.spec) return pendingProbe.promise;

      const promise = runProbe(probing).finally(() => {
        if (pendingProbe?.promise === promise) pendingProbe = null;
      });
      pendingProbe = { spec: probing.spec, promise };
      return promise;
    }

    async function submitBuyOrderSpec(submitting: Extract<CashBuyStatus, { step: 'submitting' }>): Promise<void> {
      const { spec, submittedAt } = submitting;
      for (let replay = 0; replay <= ORDER_SUBMISSION_MAX_REPLAYS; replay++) {
        if (replay > 0) {
          await delay(ORDER_SUBMISSION_REPLAY_BASE_DELAY_MS * replay);
          if (get().status !== submitting) return;
        }
        try {
          const params = { ...spec, cryptoAsset: CASH_BUY_DESTINATION_ASSET };
          const result = await createBuyOrder(replay === 0 ? 'interactive' : 'cachedOnly', params);
          const current = get().status;
          if (!('spec' in current) || current.spec !== spec) return;
          if (result.kind === 'authRequired') {
            if (current !== submitting) return;
            set({ status: { step: 'probing', spec, submittedAt } });
            parkForReauth();
            return;
          }
          set({ status: { step: 'polling', orderId: spec.id, order: null, submittedAt } });
          return;
        } catch (error) {
          const current = get().status;
          if (!('spec' in current) || current.spec !== spec) return;
          if (replay === 0 && isPasskeyCancellation(error)) {
            set({ status: { step: 'idle' } });
            return;
          }
          if (isCashAccessRefusedError(error)) {
            set({ status: { step: 'accessRefused', spec } });
            return;
          }
          if (isDefinitiveRejection(error)) {
            if (replay > 0 && current !== submitting) return;
            logger.error(new RainbowError('[cashBuyOrderStore] createBuyOrder failed', error));
            analytics.track(analytics.event.cashBuyOrderFailed, { orderId: spec.id, failureReason: null, errorCode: 'GENERIC' });
            set({ status: { step: 'error', errorCode: 'GENERIC', order: null } });
            // A 404 says the backend did not recognise something this order named, and the linked wallet
            // is the part of that we cache — persisted, so a stale entry would fail every retry. Dropping
            // it costs the next attempt one GET and lets that attempt gate on the truth; absence only
            // ever means "ask the server".
            if (isNotFoundError(error)) useCashWalletStore.getState().clear();
            return;
          }
          if (current !== submitting) return;
          logger.warn('[cashBuyOrderStore] createBuyOrder failed ambiguously', { orderId: spec.id, replay });
        }
      }
      // Repeated ambiguous writes say the write path is unhealthy: stop writing, start reading.
      if ((await probeOrder({ step: 'probing', spec, submittedAt })) === 'authRequired') parkForReauth();
    }

    return {
      status: { step: 'idle' },

      submitBuyOrder: async ({ cardId, depositAmount, walletAddress }) => {
        const { status } = get();
        if (selectCashBuyPhase({ status }) === 'pending') return;

        analytics.track(analytics.event.cashBuyOrderSubmitted, { amount: toAnalyticsAmount(depositAmount) });

        const retained =
          (status.step === 'notPlaced' || status.step === 'accessRefused') &&
          status.spec.cardId === cardId &&
          status.spec.depositAmount === depositAmount &&
          status.spec.walletAddress === walletAddress
            ? status.spec
            : null;
        const submitting = {
          step: 'submitting',
          // A same-ID retry is a new attempt; results from the earlier spec must not settle it.
          spec: { cardId, depositAmount, walletAddress, id: retained?.id ?? uuidv4() },
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
          const result = await getOrderWithCachedAuth(orderId, requestController);
          if (abortController?.signal.aborted) return;
          const current = get().status;
          if (current.step !== 'polling' || current.orderId !== orderId) return;
          if (result.kind === 'authRequired') {
            parkForReauth();
          } else if (isTerminalBuyOrder(result.data)) {
            applyTerminalOrder(result.data);
          } else {
            set({ status: { ...current, order: result.data } });
          }
        } catch (error) {
          if (abortController?.signal.aborted) return;
          // Ramp keeps refusing a blocked account, so polling could only re-show the notice every tick.
          if (isCashAccessRefusedError(error)) {
            set({ status: { step: 'idle' } });
            return;
          }
          throw error;
        } finally {
          abortController?.signal.removeEventListener('abort', propagateAbort);
        }
      },

      resumeOrder: async () => {
        const { status } = get();
        if (status.step !== 'submitting' && status.step !== 'probing' && status.step !== 'paused') return 'completed';
        return probeOrder({ step: 'probing', spec: status.spec, submittedAt: status.submittedAt });
      },

      suspendSubmission: () => {
        const { status } = get();
        if (status.step === 'submitting') set({ status: { step: 'probing', spec: status.spec, submittedAt: status.submittedAt } });
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
    // Persist only the states whose order identity is worth recovering after a kill:
    // - a spec whose outcome is unknown ('submitting', 'probing', 'paused') is probed, never replayed,
    //   on the next Add Cash open — a user who left may have deposited elsewhere.
    // - 'polling' resumes on the next Add Cash open, so the success status carrying a `transactionHash`
    //   is not lost.
    // - 'accessRefused' retains an ambiguous submission's id for the user's manual retry.
    // Terminal states collapse to idle: the sheet resets them on open anyway.
    partialize: state => ({
      status: selectCashBuyPhase(state) === 'pending' || state.status.step === 'accessRefused' ? state.status : { step: 'idle' as const },
    }),
  }
);

export const cashBuyOrderActions = createStoreActions(useCashBuyOrderStore);

export const useCashBuyPhase = () => useCashBuyOrderStore(selectCashBuyPhase);
