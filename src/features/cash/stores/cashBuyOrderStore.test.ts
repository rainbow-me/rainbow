import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { analytics } from '@/analytics';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { logger } from '@/logger';
import { pendingTransactionsActions } from '@/state/pendingTransactions';
import { delay } from '@/utils/delay';

import {
  CASH_BUY_DESTINATION_ASSET,
  ORDER_REQUEST_TTL_MS,
  ORDER_SERVER_CLOCK_MARGIN_MS,
  ORDER_SUBMISSION_REPLAY_BASE_DELAY_MS,
} from '../constants';
import { CashAccessRefusedError } from '../services/cashAccessRefusal';
import { isPasskeyCancellation } from '../services/cashPasskeyService';
import {
  OrderFailureReason,
  OrderStatus,
  createBuyOrder as rampCreateBuyOrder,
  getOrderWithCachedAuth as rampGetOrderWithCachedAuth,
  RampNetwork,
  type BuyOrder,
  type BuyOrderSpec,
  type TerminalBuyOrder,
} from '../services/rampClient';
import { buildCashPurchaseTransaction } from '../utils/buildCashPurchaseTransaction';
import { useCashAuthGateStore } from './cashAuthGateStore';
import { cashBuyOrderActions, selectCashBuyPhase, useCashBuyOrderStore, type CashBuyStatus } from './cashBuyOrderStore';
import { useCashWalletStore } from './cashWalletStore';

vi.mock('@/analytics', () => ({
  analytics: {
    track: vi.fn(),
    event: {
      cashBuyOrderCompleted: 'cash.buy_completed',
      cashBuyOrderFailed: 'cash.buy_failed',
      cashBuyOrderSubmitted: 'cash.buy_submitted',
    },
  },
}));

vi.mock('@/features/local-auth/legacyKeychain', () => ({}));

vi.mock('@/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  RainbowError: class RainbowError extends Error {
    constructor(message: string, cause?: unknown) {
      super(message, { cause });
    }
  },
}));

vi.mock('@/utils/delay', () => ({
  delay: vi.fn(() => Promise.resolve()),
}));

vi.mock('../services/cashPasskeyService', () => ({
  isPasskeyCancellation: vi.fn(() => false),
}));

vi.mock('../services/rampClient', async () => ({
  ...(await vi.importActual<typeof import('../services/rampClient')>('../services/rampClient')),
  createBuyOrder: vi.fn(),
  getOrderWithCachedAuth: vi.fn(),
}));

let mockUuidCounter = 0;
vi.mock('uuid', () => ({
  v4: vi.fn(() => {
    mockUuidCounter += 1;
    return `order-${mockUuidCounter}`;
  }),
}));

vi.mock('@/state/pendingTransactions', () => ({
  pendingTransactionsActions: { addPendingTransaction: vi.fn() },
}));

vi.mock('../utils/buildCashPurchaseTransaction', () => ({
  buildCashPurchaseTransaction: vi.fn(),
}));

const createBuyOrder = rampCreateBuyOrder as Mock;
const getOrder = rampGetOrderWithCachedAuth as Mock;
const mockDelay = vi.mocked(delay);
const mockIsPasskeyCancellation = vi.mocked(isPasskeyCancellation);
const addPendingTransaction = pendingTransactionsActions.addPendingTransaction as Mock;
const buildPurchaseTransaction = buildCashPurchaseTransaction as Mock;
const track = analytics.track as Mock;

const PURCHASE_TRANSACTION = { hash: '0xtx', type: 'purchase' };

// ---- Fixtures --------------------------------------------------------------

// The client submits the checksummed account address; the ramp echoes it back lowercased. Both forms are
// fixtures on purpose — an all-lowercase address cannot express the difference the store has to reconcile.
const WALLET_ADDRESS = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const RAMP_WALLET_ADDRESS = WALLET_ADDRESS.toLowerCase();

const SUBMITTED_AT = 1750789885000;
// The required request lifetime, pinned independently of ORDER_REQUEST_TTL_MS so a change to it fails here.
const REQUEST_TTL_MS = 60_000;
const SPEC: BuyOrderSpec = {
  cardId: 'card-1',
  depositAmount: '50',
  expireTime: new Date(SUBMITTED_AT + REQUEST_TTL_MS).toISOString(),
  id: 'order-1',
  walletAddress: WALLET_ADDRESS,
};
const AFTER_EXPIRY = SUBMITTED_AT + ORDER_REQUEST_TTL_MS + ORDER_SERVER_CLOCK_MARGIN_MS;

const PENDING_ORDER: Exclude<BuyOrder, TerminalBuyOrder> = { id: 'order-1', status: OrderStatus.Pending };
const PROCESSING_ORDER: Exclude<BuyOrder, TerminalBuyOrder> = { id: 'order-1', status: OrderStatus.Processing };
const COMPLETED_ORDER = {
  id: 'order-1',
  status: OrderStatus.Completed,
  cryptoAmount: { amount: '50', asset: { network: RampNetwork.Base } },
  fiatAmount: { amount: '50', currency: 'USD' },
  createdTime: new Date('2026-06-24T18:31:25.000Z').getTime(),
  walletAddress: RAMP_WALLET_ADDRESS,
  transactionHash: '0xtx',
  completedTime: new Date('2026-06-24T18:31:31.000Z').getTime(),
} satisfies Extract<BuyOrder, { status: OrderStatus.Completed }>;
const FAILED_PAYMENT_ORDER: Extract<BuyOrder, { status: OrderStatus.Failed }> = {
  id: 'order-1',
  status: OrderStatus.Failed,
  failureReason: OrderFailureReason.PaymentRejected,
};

const SUBMIT_INPUT = { cardId: 'card-1', depositAmount: '50', walletAddress: WALLET_ADDRESS };
const LINKED_WALLET = { id: 'wallet-1', address: RAMP_WALLET_ADDRESS };

const SUBMITTING: CashBuyStatus = { step: 'submitting', spec: SPEC, submittedAt: SUBMITTED_AT };
const PROBING: CashBuyStatus = { step: 'probing', spec: SPEC, submittedAt: SUBMITTED_AT };
const PAUSED: CashBuyStatus = { step: 'paused', spec: SPEC, submittedAt: SUBMITTED_AT };
const AUTH_REQUIRED = { kind: 'authRequired' } as const;
const CREATE_SUCCESS = { kind: 'success', data: undefined } as const;
const RESUME_ORDER_GATE = { step: 'authRequired', intent: { kind: 'resumeOrder' } };

function orderResult(order: BuyOrder) {
  return { kind: 'success', data: order };
}

/** Stamped by default with the clock at the moment it is built, as the gateway's `Date` header would be. */
function fetchError(status: number, serverTime: number | null = now): RainbowFetchError {
  const headers = new Headers(serverTime === null ? {} : { date: new Date(serverTime).toUTCString() });
  return new RainbowFetchError({ message: 'not found', response: { status, headers } as Response });
}

async function notFoundWhenAnswered(): Promise<never> {
  throw fetchError(404);
}

function networkPolicyError(): CashAccessRefusedError {
  return new CashAccessRefusedError('networkPolicy', new RainbowFetchError({ message: 'network policy' }));
}

const store = useCashBuyOrderStore;
const getState = () => store.getState();
const phase = () => selectCashBuyPhase(getState());
const gate = () => useCashAuthGateStore.getState().status;

let now = SUBMITTED_AT;
vi.spyOn(Date, 'now').mockImplementation(() => now);

beforeEach(() => {
  vi.clearAllMocks();
  now = SUBMITTED_AT;
  mockUuidCounter = 0;
  store.setState({ status: { step: 'idle' } });
  useCashAuthGateStore.getState().clear();
  useCashWalletStore.getState().clear();
  buildPurchaseTransaction.mockReturnValue(PURCHASE_TRANSACTION);
  createBuyOrder.mockResolvedValue(CREATE_SUCCESS);
  mockDelay.mockImplementation(async ms => {
    now += ms;
  });
  mockIsPasskeyCancellation.mockReturnValue(false);
});

// ---------------------------------------------------------------------------

describe('submitBuyOrder', () => {
  it('rounds the amount before tracking a submitted order', async () => {
    await getState().submitBuyOrder({ ...SUBMIT_INPUT, depositAmount: '123.456789' });

    expect(track).toHaveBeenCalledWith(analytics.event.cashBuyOrderSubmitted, { amount: 123 });
  });

  it('builds a spec, creates the order, and surfaces the created order id as pending', async () => {
    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder).toHaveBeenCalledWith('interactive', { ...SPEC, cryptoAsset: CASH_BUY_DESTINATION_ASSET });
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: null, submittedAt: expect.any(Number) });
    expect(phase()).toBe('pending');
  });

  it('fetches full details before applying a terminal order', async () => {
    getOrder.mockResolvedValue(orderResult(COMPLETED_ORDER));

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(phase()).toBe('pending');
    expect(addPendingTransaction).not.toHaveBeenCalled();

    await getState().syncActiveOrder();

    expect(getOrder).toHaveBeenCalledWith(SPEC.id, expect.any(AbortController));
    expect(addPendingTransaction).toHaveBeenCalled();
    expect(phase()).toBe('success');
  });

  // An ambiguous failure (transport error, 408, 429, 5xx) leaves it unknown whether the order was created, so
  // the same id is replayed silently, preserving the order ID across attempts.
  it.each([
    { label: 'a transport error', failure: new Error('network down') },
    { label: 'a 408', failure: fetchError(408) },
    { label: 'a 429', failure: fetchError(429) },
    { label: 'a 500', failure: fetchError(500) },
  ])('silently replays the same order id after $label', async ({ failure }) => {
    createBuyOrder.mockRejectedValueOnce(failure);

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder).toHaveBeenCalledTimes(2);
    expect(createBuyOrder.mock.calls[0][0]).toBe('interactive');
    expect(createBuyOrder.mock.calls[1][0]).toBe('cachedOnly');
    expect(createBuyOrder.mock.calls[1][1].id).toBe(SPEC.id);
    expect(mockDelay).toHaveBeenCalledWith(ORDER_SUBMISSION_REPLAY_BASE_DELAY_MS);
    expect(logger.error).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, expect.anything());
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: null, submittedAt: expect.any(Number) });
  });

  it('backs off further on each replay', async () => {
    createBuyOrder.mockRejectedValueOnce(new Error('network down')).mockRejectedValueOnce(new Error('network down'));

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(mockDelay.mock.calls).toEqual([[ORDER_SUBMISSION_REPLAY_BASE_DELAY_MS], [ORDER_SUBMISSION_REPLAY_BASE_DELAY_MS * 2]]);
    expect(createBuyOrder.mock.calls.map(([authMode]) => authMode)).toEqual(['interactive', 'cachedOnly', 'cachedOnly']);
  });

  it('drops a replay whose submission was reset during the backoff', async () => {
    createBuyOrder.mockRejectedValue(new Error('network down'));
    mockDelay.mockImplementationOnce(() => {
      getState().reset();
      return Promise.resolve();
    });

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder).toHaveBeenCalledTimes(1);
    expect(createBuyOrder).toHaveBeenCalledWith('interactive', expect.anything());
    expect(getOrder).not.toHaveBeenCalled();
    expect(phase()).toBe('idle');
  });

  // Once the request expires a write can no longer create the order: it is read back under its id,
  // never written again, after the backend can no longer create it either.
  describe('after the request expires', () => {
    let postedAt: number[];
    let probedAt: number[];

    beforeEach(() => {
      postedAt = [];
      probedAt = [];
      createBuyOrder.mockImplementation(async () => {
        postedAt.push(now);
        throw new Error('network down');
      });
      getOrder.mockImplementation(async () => {
        probedAt.push(now);
        return orderResult(PENDING_ORDER);
      });
    });

    it('replays the same id only before it expires, then probes it once creation closes', async () => {
      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(postedAt.length).toBeGreaterThan(3);
      expect(postedAt.every(at => at < Date.parse(SPEC.expireTime))).toBe(true);
      expect(new Set(createBuyOrder.mock.calls.map(([, params]) => params.id))).toEqual(new Set([SPEC.id]));
      expect(getOrder).toHaveBeenCalledWith(SPEC.id);
      expect(probedAt).toEqual([AFTER_EXPIRY]);
    });

    // The `Date` header has whole-second resolution, so a sub-second cutoff must not push the first probe's 404
    // just below it.
    it('settles the first probe after a sub-second expiry as not placed', async () => {
      now = SUBMITTED_AT + 400;
      getOrder.mockImplementation(notFoundWhenAnswered);

      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(getOrder).toHaveBeenCalledTimes(1);
      expect(getState().status.step).toBe('notPlaced');
    });

    it('resumes polling when the probe finds the order', async () => {
      getOrder.mockResolvedValue(orderResult(PENDING_ORDER));

      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: PENDING_ORDER, submittedAt: expect.any(Number) });
      expect(phase()).toBe('pending');
    });

    it('applies a terminal order the probe finds', async () => {
      getOrder.mockResolvedValue(orderResult(COMPLETED_ORDER));

      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(addPendingTransaction).toHaveBeenCalled();
      expect(getState().status).toEqual({ step: 'success', order: COMPLETED_ORDER });
    });

    it('reports nothing was charged when the probe finds no order after the request expired', async () => {
      getOrder.mockImplementation(notFoundWhenAnswered);

      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(getState().status).toEqual({ step: 'notPlaced', spec: SPEC });
      expect(phase()).toBe('error');
      expect(useCashWalletStore.getState().linkedWallets).toEqual([]);
    });

    it('pauses deposits when the probe is ambiguous too', async () => {
      getOrder.mockRejectedValue(new Error('timeout'));

      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(getState().status).toEqual({ step: 'paused', spec: SPEC, submittedAt: expect.any(Number) });
      expect(phase()).toBe('pending');
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('parks the re-auth gate and keeps probing when the probe has no token', async () => {
      getOrder.mockResolvedValue(AUTH_REQUIRED);

      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(getState().status).toEqual({ step: 'probing', spec: SPEC, submittedAt: expect.any(Number) });
      expect(gate()).toEqual(RESUME_ORDER_GATE);
    });
  });

  describe('passkey cancellation', () => {
    beforeEach(() => {
      mockIsPasskeyCancellation.mockReturnValue(true);
    });

    // Nothing reached the backend, so there is nothing to recover — and nothing failed.
    it('returns to idle silently when the first attempt is cancelled', async () => {
      createBuyOrder.mockRejectedValue(new Error('UserCancelled'));

      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(getState().status).toEqual({ step: 'idle' });
      expect(logger.error).not.toHaveBeenCalled();
      expect(track).not.toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, expect.anything());
    });

    // The earlier attempt may have landed, so an automatic replay without a cached token parks for a probe.
    it('parks the re-auth gate when a replay needs authentication', async () => {
      mockIsPasskeyCancellation.mockReturnValue(false);
      createBuyOrder.mockRejectedValueOnce(new Error('network down'));
      createBuyOrder.mockResolvedValueOnce(AUTH_REQUIRED);

      await getState().submitBuyOrder(SUBMIT_INPUT);

      expect(getState().status).toEqual({ step: 'probing', spec: SPEC, submittedAt: expect.any(Number) });
      expect(gate()).toEqual(RESUME_ORDER_GATE);
      expect(createBuyOrder).toHaveBeenLastCalledWith('cachedOnly', expect.anything());
      expect(getOrder).not.toHaveBeenCalled();
    });
  });

  it('drops the spec and reports a GENERIC error on a definitive backend rejection', async () => {
    createBuyOrder.mockRejectedValue(fetchError(422));

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, { orderId: SPEC.id, failureReason: null, errorCode: 'GENERIC' });
    expect(getState().status).toEqual({ step: 'error', errorCode: 'GENERIC', order: null });
    expect(phase()).toBe('error');
  });

  it('generates a fresh order id when retrying after a definitive backend rejection', async () => {
    createBuyOrder.mockRejectedValueOnce(fetchError(422)).mockResolvedValueOnce(CREATE_SUCCESS);

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder.mock.calls[1][1].id).toBe('order-2');
  });

  it('replays the same order id with a fresh expiry when retrying an unplaced order with identical inputs', async () => {
    store.setState({ status: { step: 'notPlaced', spec: SPEC } });
    now = AFTER_EXPIRY;

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder.mock.calls[0][1]).toMatchObject({
      id: SPEC.id,
      expireTime: new Date(AFTER_EXPIRY + REQUEST_TTL_MS).toISOString(),
    });
  });

  it('retains the order id for a manual retry after a network policy response', async () => {
    createBuyOrder.mockRejectedValueOnce(networkPolicyError()).mockResolvedValueOnce(CREATE_SUCCESS);

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder).toHaveBeenCalledTimes(1);
    expect(getState().status).toEqual({ step: 'accessRefused', spec: SPEC });
    expect(phase()).toBe('idle');
    expect(track).not.toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, expect.anything());

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder.mock.calls[1][1].id).toBe(SPEC.id);
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: null, submittedAt: expect.any(Number) });
  });

  it('does not let an earlier submit settle a newer retry with the same order id', async () => {
    let resolveOriginal: () => void = () => undefined;
    let resolveRetry: () => void = () => undefined;
    createBuyOrder
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveOriginal = () => resolve(CREATE_SUCCESS);
        })
      )
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveRetry = () => resolve(CREATE_SUCCESS);
        })
      );
    getOrder.mockImplementationOnce(notFoundWhenAnswered);

    const original = getState().submitBuyOrder(SUBMIT_INPUT);
    now = AFTER_EXPIRY;
    await getState().resumeOrder();
    const retry = getState().submitBuyOrder(SUBMIT_INPUT);

    resolveOriginal();
    await original;
    expect(getState().status).toMatchObject({ step: 'submitting', spec: { id: SPEC.id } });

    resolveRetry();
    await retry;
    expect(getState().status).toMatchObject({ step: 'polling', orderId: SPEC.id });
  });

  // The backend can still create the order while the original submit is in flight, so a 404 then must not
  // invite a second submission that could charge the user again.
  it('pauses instead of allowing a resubmit when the probe finds no order before the request expires', async () => {
    let resolveOriginal: () => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise(resolve => {
        resolveOriginal = () => resolve(CREATE_SUCCESS);
      })
    );
    getOrder.mockImplementationOnce(notFoundWhenAnswered);

    const original = getState().submitBuyOrder(SUBMIT_INPUT);
    await getState().resumeOrder();

    expect(getState().status).toEqual(PAUSED);

    await getState().submitBuyOrder({ ...SUBMIT_INPUT, depositAmount: '100' });
    expect(createBuyOrder).toHaveBeenCalledTimes(1);

    resolveOriginal();
    await original;
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: null, submittedAt: SUBMITTED_AT });
  });

  it('generates a fresh order id when the retried inputs differ from the unplaced spec', async () => {
    store.setState({ status: { step: 'notPlaced', spec: { ...SPEC, id: 'order-stale' } } });

    await getState().submitBuyOrder({ ...SUBMIT_INPUT, depositAmount: '100' });

    expect(createBuyOrder.mock.calls[0][1]).toMatchObject({ id: 'order-1', depositAmount: '100' });
  });

  // A 404 is the only handle the ramp surface gives on "the wallet you named is not linked", so it
  // is the one failure that invalidates the cache. Every other failure leaves it alone.
  const cacheOutcomes: { label: string; failure: unknown; cleared: boolean }[] = [
    { label: 'a 404', failure: fetchError(404), cleared: true },
    { label: 'a 500', failure: fetchError(500), cleared: false },
    { label: 'a transport error with no response', failure: new Error('network down'), cleared: false },
  ];

  it.each(cacheOutcomes)('$label leaves the linked-wallet cache cleared=$cleared', async ({ failure, cleared }) => {
    useCashWalletStore.setState({ linkedWallets: [LINKED_WALLET] });
    createBuyOrder.mockRejectedValue(failure);
    getOrder.mockRejectedValue(new Error('timeout'));

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(useCashWalletStore.getState().linkedWallets).toEqual(cleared ? [] : [LINKED_WALLET]);
  });

  it('keeps the linked-wallet cache when the order is created', async () => {
    useCashWalletStore.setState({ linkedWallets: [LINKED_WALLET] });

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(useCashWalletStore.getState().linkedWallets).toEqual([LINKED_WALLET]);
  });

  it('ignores a second submission while one is already in flight', async () => {
    let resolveOrder: () => void = () => undefined;
    createBuyOrder.mockReturnValue(
      new Promise(resolve => {
        resolveOrder = () => resolve(CREATE_SUCCESS);
      })
    );

    const inFlight = getState().submitBuyOrder(SUBMIT_INPUT); // sets 'submitting' → pending, then awaits createBuyOrder
    await getState().submitBuyOrder(SUBMIT_INPUT); // guard sees 'pending' and returns immediately

    expect(createBuyOrder).toHaveBeenCalledTimes(1);

    resolveOrder();
    await inFlight;
  });

  it('stops scheduled replays when the active sheet is dismissed', async () => {
    let releaseDelay: () => void = () => undefined;
    let markDelayStarted: () => void = () => undefined;
    const delayStarted = new Promise<void>(resolve => {
      markDelayStarted = resolve;
    });
    createBuyOrder.mockRejectedValueOnce(new Error('network down'));
    mockDelay.mockImplementationOnce(() => {
      markDelayStarted();
      return new Promise<void>(resolve => {
        releaseDelay = resolve;
      });
    });

    const submission = getState().submitBuyOrder(SUBMIT_INPUT);
    await delayStarted;
    getState().suspendSubmission();
    releaseDelay();
    await submission;

    expect(createBuyOrder).toHaveBeenCalledTimes(1);
    expect(createBuyOrder).not.toHaveBeenCalledWith('cachedOnly', expect.anything());
    expect(getState().status).toEqual({ step: 'probing', spec: SPEC, submittedAt: expect.any(Number) });
  });

  it.each([PROBING, PAUSED])('ignores a submission while the previous order is unresolved ($step)', async status => {
    store.setState({ status });

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder).not.toHaveBeenCalled();
    expect(getState().status).toEqual(status);
  });
});

describe('syncActiveOrder', () => {
  const startPolling = (order: Exclude<BuyOrder, TerminalBuyOrder>) =>
    store.setState({ status: { step: 'polling', orderId: order.id, order, submittedAt: SUBMITTED_AT } });

  it('advances the order to the next non-terminal status', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockResolvedValue(orderResult(PROCESSING_ORDER));

    await getState().syncActiveOrder(new AbortController());

    expect(getOrder).toHaveBeenCalledWith(PENDING_ORDER.id, expect.any(AbortController));
    expect(getState().status).toEqual({ step: 'polling', orderId: PENDING_ORDER.id, order: PROCESSING_ORDER, submittedAt: SUBMITTED_AT });
    expect(phase()).toBe('pending');
  });

  // A poll tick is automatic, so it never runs the sign-in ceremony: auth loss parks the sheet's gate
  // and the order waits for the user's Re-authenticate tap.
  it('parks the re-auth gate and keeps polling when the token is gone', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockResolvedValue(AUTH_REQUIRED);

    await getState().syncActiveOrder(new AbortController());

    expect(gate()).toEqual(RESUME_ORDER_GATE);
    expect(getState().status).toEqual({ step: 'polling', orderId: PENDING_ORDER.id, order: PENDING_ORDER, submittedAt: SUBMITTED_AT });
    expect(logger.error).not.toHaveBeenCalled();
  });

  // rainbowFetch arms its 30s timeout on the controller it receives, so handing it the watcher's
  // controller would let one hung request abort the whole poll loop.
  it('passes a request-scoped controller to getOrder, never the watcher controller itself', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockResolvedValue(orderResult(PROCESSING_ORDER));
    const watcherController = new AbortController();

    await getState().syncActiveOrder(watcherController);

    const [, requestController] = getOrder.mock.calls[0] as [string, AbortController];
    expect(requestController).toBeInstanceOf(AbortController);
    expect(requestController).not.toBe(watcherController);
  });

  it('aborts the in-flight request and stays quiet when the watcher aborts mid-flight', async () => {
    startPolling(PENDING_ORDER);
    const watcherController = new AbortController();
    getOrder.mockImplementation(
      (_orderId: string, requestController: AbortController) =>
        new Promise((_resolve, reject) => {
          requestController.signal.addEventListener('abort', () => reject(new Error('Aborted')));
        })
    );

    const inFlight = getState().syncActiveOrder(watcherController);
    watcherController.abort();
    await inFlight;

    expect(logger.error).not.toHaveBeenCalled();
    expect(getState().status).toMatchObject({ step: 'polling', order: PENDING_ORDER });
  });

  it('discards a response that resolves after the order was reset', async () => {
    startPolling(PENDING_ORDER);
    let resolveOrder: (order: BuyOrder) => void = () => undefined;
    getOrder.mockReturnValue(
      new Promise<BuyOrder>(resolve => {
        resolveOrder = resolve;
      }).then(orderResult)
    );

    const inFlight = getState().syncActiveOrder();
    getState().reset();
    resolveOrder(COMPLETED_ORDER);
    await inFlight;

    expect(addPendingTransaction).not.toHaveBeenCalled();
    expect(phase()).toBe('idle');
  });

  it('enqueues the purchase transaction and surfaces the order as success when polling resolves to completed', async () => {
    startPolling(PROCESSING_ORDER);
    getOrder.mockResolvedValue(orderResult(COMPLETED_ORDER));

    await getState().syncActiveOrder();

    expect(buildPurchaseTransaction).toHaveBeenCalledWith({ order: COMPLETED_ORDER, walletAddress: WALLET_ADDRESS });
    expect(addPendingTransaction).toHaveBeenCalledWith({
      address: WALLET_ADDRESS,
      pendingTransaction: PURCHASE_TRANSACTION,
    });
    expect(getState().status).toEqual({ step: 'success', order: COMPLETED_ORDER });
    expect(phase()).toBe('success');
    expect(track).toHaveBeenCalledWith('cash.buy_completed', {
      fiatAmount: 50,
      fiatCurrency: 'USD',
      cryptoAmount: 50,
      network: RampNetwork.Base,
      timeToUsdcMs: 6_000,
    });
  });

  it('surfaces success without an Activity entry when its required payload is malformed', async () => {
    startPolling(PROCESSING_ORDER);
    const orderWithoutWalletAddress = { ...COMPLETED_ORDER, walletAddress: undefined };
    getOrder.mockResolvedValue(orderResult(orderWithoutWalletAddress));

    await getState().syncActiveOrder();

    expect(addPendingTransaction).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(getState().status).toEqual({ step: 'success', order: orderWithoutWalletAddress });
  });

  it('preserves an Activity error as the logged cause', async () => {
    startPolling(PROCESSING_ORDER);
    const cause = new Error('failed to build Activity entry');
    buildPurchaseTransaction.mockImplementationOnce(() => {
      throw cause;
    });
    getOrder.mockResolvedValue(orderResult(COMPLETED_ORDER));

    await getState().syncActiveOrder();

    const [loggedError] = (logger.error as Mock).mock.calls[0];
    expect(loggedError.cause).toBe(cause);
  });

  it('skips completion analytics without blocking the Activity entry or success', async () => {
    startPolling(PROCESSING_ORDER);
    const order = { ...COMPLETED_ORDER, completedTime: undefined };
    getOrder.mockResolvedValue(orderResult(order));

    await getState().syncActiveOrder();

    expect(track).not.toHaveBeenCalledWith('cash.buy_completed', expect.anything());
    expect(addPendingTransaction).toHaveBeenCalled();
    expect(getState().status).toEqual({ step: 'success', order });
  });

  it('rounds the fiat and crypto amounts before tracking a completed order', async () => {
    const completedOrder = {
      ...COMPLETED_ORDER,
      fiatAmount: { ...COMPLETED_ORDER.fiatAmount, amount: '123.456789' },
      cryptoAmount: { ...COMPLETED_ORDER.cryptoAmount, amount: '0.123456789' },
    };
    startPolling(PROCESSING_ORDER);
    getOrder.mockResolvedValue(orderResult(completedOrder));

    await getState().syncActiveOrder();

    expect(track).toHaveBeenCalledWith(analytics.event.cashBuyOrderCompleted, {
      fiatAmount: 123,
      fiatCurrency: 'USD',
      cryptoAmount: 0.123,
      network: RampNetwork.Base,
      timeToUsdcMs: 6_000,
    });
  });

  // usePendingTransactionsStore is a raw-keyed map and every reader looks the row up under the app's
  // checksummed account address, so filing it under the ramp's lowercased echo hides it from all of them.
  it('keys the pending transaction by the checksummed address, not the ramp echo', async () => {
    startPolling(PROCESSING_ORDER);
    getOrder.mockResolvedValue(orderResult(COMPLETED_ORDER));

    await getState().syncActiveOrder();

    const { address } = addPendingTransaction.mock.calls[0][0];
    expect(address).toBe(WALLET_ADDRESS);
    expect(address).not.toBe(COMPLETED_ORDER.walletAddress);
  });

  it('surfaces a payment-rejected error when polling resolves to failed', async () => {
    startPolling(PROCESSING_ORDER);
    getOrder.mockResolvedValue(orderResult(FAILED_PAYMENT_ORDER));

    await getState().syncActiveOrder();

    expect(getState().status).toEqual({ step: 'error', errorCode: 'PAYMENT_REJECTED', order: FAILED_PAYMENT_ORDER });
    expect(phase()).toBe('error');
  });

  it('keeps the current order and rethrows so the watcher can back off', async () => {
    startPolling(PENDING_ORDER);
    const error = new Error('timeout');
    getOrder.mockRejectedValue(error);

    await expect(getState().syncActiveOrder()).rejects.toBe(error);

    expect(getState().status).toMatchObject({ step: 'polling', order: PENDING_ORDER });
    expect(phase()).toBe('pending');
  });

  it('stops polling once Ramp refuses access to the account', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockRejectedValue(new CashAccessRefusedError('unavailable'));

    await expect(getState().syncActiveOrder()).resolves.toBeUndefined();

    expect(getState().status).toEqual({ step: 'idle' });
  });

  it('does nothing when there is no active order', async () => {
    await getState().syncActiveOrder(); // idle from beforeEach
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('does nothing when the order has already reached a terminal status', async () => {
    store.setState({ status: { step: 'success', order: COMPLETED_ORDER } });
    await getState().syncActiveOrder();
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('does nothing when the request has already been aborted', async () => {
    startPolling(PENDING_ORDER);
    const controller = new AbortController();
    controller.abort();

    await getState().syncActiveOrder(controller);

    expect(getOrder).not.toHaveBeenCalled();
  });
});

// A reopen can no longer presume the user's intent (they may have deposited elsewhere), so a
// rehydrated spec is only ever read back — a probe never charges.
describe('resumeOrder', () => {
  it.each([SUBMITTING, PROBING, PAUSED])('probes a rehydrated $step spec instead of replaying it', async status => {
    store.setState({ status });
    getOrder.mockResolvedValue(orderResult(PENDING_ORDER));

    await expect(getState().resumeOrder()).resolves.toBe('completed');

    expect(createBuyOrder).not.toHaveBeenCalled();
    expect(getOrder).toHaveBeenCalledWith(SPEC.id);
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: PENDING_ORDER, submittedAt: SUBMITTED_AT });
    expect(phase()).toBe('pending');
  });

  it('applies a terminal order the probe finds', async () => {
    store.setState({ status: SUBMITTING });
    getOrder.mockResolvedValue(orderResult(FAILED_PAYMENT_ORDER));

    await getState().resumeOrder();

    expect(getState().status).toEqual({ step: 'error', errorCode: 'PAYMENT_REJECTED', order: FAILED_PAYMENT_ORDER });
  });

  it('reports nothing was charged when the probe finds no order after the request expired', async () => {
    store.setState({ status: PAUSED });
    getOrder.mockImplementation(notFoundWhenAnswered);
    now = AFTER_EXPIRY;

    await getState().resumeOrder();

    expect(getState().status).toEqual({ step: 'notPlaced', spec: SPEC });
  });

  // The device clock can be wrong in either direction; only the backend's own clock says creation has closed.
  it.each([
    {
      label: 'an expired server clock despite a device clock behind it',
      deviceTime: SUBMITTED_AT,
      serverTime: AFTER_EXPIRY,
      step: 'notPlaced',
    },
    {
      label: 'an unexpired server clock despite a device clock past it',
      deviceTime: AFTER_EXPIRY + ORDER_REQUEST_TTL_MS,
      serverTime: AFTER_EXPIRY - 1000,
      step: 'paused',
    },
    { label: 'no server clock reading', deviceTime: AFTER_EXPIRY, serverTime: null, step: 'paused' },
  ])('settles a 404 with $label as $step', async ({ deviceTime, serverTime, step }) => {
    store.setState({ status: PAUSED });
    now = deviceTime;
    getOrder.mockRejectedValue(fetchError(404, serverTime));

    await getState().resumeOrder();

    expect(getState().status.step).toBe(step);
  });

  it('stays paused when the probe is ambiguous', async () => {
    store.setState({ status: PAUSED });
    getOrder.mockRejectedValue(new Error('timeout'));

    await getState().resumeOrder();

    expect(getState().status).toEqual(PAUSED);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  // The gate that called it decides what to do about auth, so the store only reports it.
  it('reports authRequired and keeps probing without parking the gate itself', async () => {
    store.setState({ status: SUBMITTING });
    getOrder.mockResolvedValue(AUTH_REQUIRED);

    await expect(getState().resumeOrder()).resolves.toBe('authRequired');

    expect(getState().status).toEqual(PROBING);
    expect(gate()).toEqual({ step: 'closed' });
  });

  it.each<CashBuyStatus>([
    { step: 'idle' },
    { step: 'polling', orderId: SPEC.id, order: PENDING_ORDER, submittedAt: SUBMITTED_AT },
    { step: 'notPlaced', spec: SPEC },
  ])('is a no-op on $step', async status => {
    store.setState({ status });

    await expect(getState().resumeOrder()).resolves.toBe('completed');

    expect(getOrder).not.toHaveBeenCalled();
    expect(getState().status).toEqual(status);
  });
});

// A dismiss/reopen probes the persisted spec while the original POST may still be in flight.
describe('concurrent submission and probe of the same spec', () => {
  it('keeps a late create acknowledgement after the sheet is dismissed', async () => {
    let resolveOriginal: () => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise(resolve => {
        resolveOriginal = () => resolve(CREATE_SUCCESS);
      })
    );

    const original = getState().submitBuyOrder(SUBMIT_INPUT);
    getState().suspendSubmission();
    resolveOriginal();
    await original;

    expect(getState().status).toMatchObject({ step: 'polling', orderId: SPEC.id, order: null });
  });

  it('applies a terminal lookup even when a late create acknowledgement arrives first', async () => {
    let resolveOriginal: () => void = () => undefined;
    let resolveProbe: (result: unknown) => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise(resolve => {
        resolveOriginal = () => resolve(CREATE_SUCCESS);
      })
    );
    getOrder.mockReturnValueOnce(
      new Promise(resolve => {
        resolveProbe = resolve;
      })
    );

    const original = getState().submitBuyOrder(SUBMIT_INPUT);
    getState().suspendSubmission();
    const probing = getState().resumeOrder();
    resolveOriginal();
    await original;
    expect(getState().status).toMatchObject({ step: 'polling', order: null });

    resolveProbe(orderResult(COMPLETED_ORDER));
    await probing;
    expect(getState().status).toEqual({ step: 'success', order: COMPLETED_ORDER });
    expect(addPendingTransaction).toHaveBeenCalledTimes(1);
  });

  it('does not pause an acknowledged order when the overlapping probe fails', async () => {
    let resolveOriginal: () => void = () => undefined;
    let rejectProbe: (error: Error) => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise(resolve => {
        resolveOriginal = () => resolve(CREATE_SUCCESS);
      })
    );
    getOrder.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectProbe = reject;
      })
    );

    const original = getState().submitBuyOrder(SUBMIT_INPUT);
    const probing = getState().resumeOrder();
    resolveOriginal();
    await original;
    rejectProbe(new Error('timeout'));
    await probing;

    expect(getState().status).toMatchObject({ step: 'polling', orderId: SPEC.id, order: null });
  });

  it('honors a late first-attempt cancellation after the sheet is dismissed', async () => {
    let rejectOriginal: (error: Error) => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectOriginal = reject;
      })
    );
    mockIsPasskeyCancellation.mockReturnValue(true);

    const original = getState().submitBuyOrder(SUBMIT_INPUT);
    getState().suspendSubmission();
    rejectOriginal(new Error('UserCancelled'));
    await original;

    expect(getState().status).toEqual({ step: 'idle' });
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('honors a late direct rejection after the sheet is dismissed', async () => {
    let rejectOriginal: (error: Error) => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectOriginal = reject;
      })
    );

    const original = getState().submitBuyOrder(SUBMIT_INPUT);
    getState().suspendSubmission();
    rejectOriginal(fetchError(422));
    await original;

    expect(getState().status).toEqual({ step: 'error', errorCode: 'GENERIC', order: null });
    expect(track).toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, { orderId: SPEC.id, failureReason: null, errorCode: 'GENERIC' });
  });

  it('does not park the gate for a stale replay that needs authentication after recovery', async () => {
    let markReplayStarted: () => void = () => undefined;
    const replayStarted = new Promise<void>(resolve => {
      markReplayStarted = resolve;
    });
    let resolveReplay: (result: typeof AUTH_REQUIRED) => void = () => undefined;
    createBuyOrder.mockRejectedValueOnce(new Error('network down')).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveReplay = resolve;
          markReplayStarted();
        })
    );
    getOrder.mockImplementationOnce(notFoundWhenAnswered);

    const submission = getState().submitBuyOrder(SUBMIT_INPUT);
    await replayStarted;
    getState().suspendSubmission();
    now = AFTER_EXPIRY;
    await getState().resumeOrder();
    resolveReplay(AUTH_REQUIRED);
    await submission;

    expect(getState().status).toEqual({ step: 'notPlaced', spec: SPEC });
    expect(gate()).toEqual({ step: 'closed' });
  });

  it('does not treat a late replay rejection as the outcome of an already recovered attempt', async () => {
    let markReplayStarted: () => void = () => undefined;
    const replayStarted = new Promise<void>(resolve => {
      markReplayStarted = resolve;
    });
    let rejectReplay: (error: Error) => void = () => undefined;
    createBuyOrder.mockRejectedValueOnce(new Error('network down')).mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectReplay = reject;
          markReplayStarted();
        })
    );
    getOrder.mockImplementationOnce(notFoundWhenAnswered);

    const submission = getState().submitBuyOrder(SUBMIT_INPUT);
    await replayStarted;
    getState().suspendSubmission();
    now = AFTER_EXPIRY;
    await getState().resumeOrder();
    rejectReplay(fetchError(422));
    await submission;

    expect(getState().status).toEqual({ step: 'notPlaced', spec: SPEC });
    expect(track).not.toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, expect.anything());
  });

  it('drops a late submit failure once the probe has already reached polling', async () => {
    let rejectOriginal: (error: Error) => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        rejectOriginal = reject;
      })
    );
    getOrder.mockResolvedValue(orderResult(PENDING_ORDER));

    const original = getState().submitBuyOrder(SUBMIT_INPUT); // hangs in flight
    await getState().resumeOrder(); // reopen probes the same spec and resolves first

    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: PENDING_ORDER, submittedAt: expect.any(Number) });

    rejectOriginal(new Error('timeout'));
    await original;

    expect(createBuyOrder).toHaveBeenCalledTimes(1);
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: PENDING_ORDER, submittedAt: expect.any(Number) });
  });

  it('drops a late submit success once the probe has already advanced the order', async () => {
    let resolveOriginal: () => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise(resolve => {
        resolveOriginal = () => resolve(CREATE_SUCCESS);
      })
    );
    getOrder.mockResolvedValue(orderResult(PENDING_ORDER));

    const original = getState().submitBuyOrder(SUBMIT_INPUT);
    await getState().resumeOrder();

    resolveOriginal();
    await original;

    // The late success must not rewind `order` to null.
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: PENDING_ORDER, submittedAt: expect.any(Number) });
  });

  it('shares an in-flight probe and applies its terminal result once', async () => {
    store.setState({ status: PROBING });
    let resolveProbe: (result: unknown) => void = () => undefined;
    getOrder.mockReturnValueOnce(
      new Promise(resolve => {
        resolveProbe = resolve;
      })
    );

    const first = getState().resumeOrder();
    const second = getState().resumeOrder();
    expect(getOrder).toHaveBeenCalledTimes(1);

    resolveProbe(orderResult(COMPLETED_ORDER));
    await Promise.all([first, second]);

    expect(getState().status).toEqual({ step: 'success', order: COMPLETED_ORDER });
    expect(addPendingTransaction).toHaveBeenCalledTimes(1);
  });

  it('allows a fresh probe once the shared lookup settles', async () => {
    store.setState({ status: PROBING });
    getOrder.mockResolvedValueOnce(AUTH_REQUIRED).mockResolvedValueOnce(orderResult(PENDING_ORDER));

    const first = getState().resumeOrder();
    const second = getState().resumeOrder();
    await expect(Promise.all([first, second])).resolves.toEqual(['authRequired', 'authRequired']);
    expect(getOrder).toHaveBeenCalledTimes(1);

    await expect(getState().resumeOrder()).resolves.toBe('completed');
    expect(getOrder).toHaveBeenCalledTimes(2);
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: PENDING_ORDER, submittedAt: SUBMITTED_AT });
  });
});

describe('reset', () => {
  it('returns the store to the idle initial state', () => {
    store.setState({ status: { step: 'error', errorCode: 'GENERIC', order: FAILED_PAYMENT_ORDER } });

    getState().reset();

    expect(getState().status).toEqual({ step: 'idle' });
    expect(phase()).toBe('idle');
  });

  it('is reachable through the exported actions bundle', () => {
    store.setState({ status: { step: 'error', errorCode: 'GENERIC', order: null } });

    cashBuyOrderActions.reset();

    expect(phase()).toBe('idle');
  });
});

describe('persistence', () => {
  async function readPersisted(): Promise<Record<string, unknown>> {
    const { name, storage } = store.persist.getOptions();
    if (!name || !storage) throw new Error('store persistence is not configured');

    const persisted = await storage.getItem(name);
    if (!persisted) throw new Error('nothing persisted');
    return persisted.state;
  }

  // A spec written before `expireTime` existed must still be settleable by a readback after an upgrade.
  it('lets a 404 settle an unresolved spec persisted without an expiry', async () => {
    const { name, storage } = store.persist.getOptions();
    if (!name || !storage) throw new Error('store persistence is not configured');
    const legacySpec = { cardId: SPEC.cardId, depositAmount: SPEC.depositAmount, id: SPEC.id, walletAddress: SPEC.walletAddress };
    await storage.setItem(name, { status: { ...PAUSED, spec: legacySpec } } as never, 1);
    await store.persist.rehydrate();
    getOrder.mockImplementation(notFoundWhenAnswered);

    await getState().resumeOrder();

    expect(getState().status).toEqual({ step: 'notPlaced', spec: { ...legacySpec, expireTime: new Date(0).toISOString() } });
  });

  it('keeps a mid-flight submission on disk (crash-during-submission recovery) — and never methods', async () => {
    store.setState({ status: SUBMITTING });

    const persisted = await readPersisted();
    expect(Object.keys(persisted)).toEqual(['status']);
    expect(persisted).toEqual({ status: SUBMITTING });
  });

  it.each([PROBING, PAUSED])('keeps an unresolved $step spec on disk so the next open can probe it', async status => {
    store.setState({ status });

    await expect(readPersisted()).resolves.toEqual({ status });
  });

  it('keeps an order id retained after a network policy response on disk', async () => {
    store.setState({ status: { step: 'accessRefused', spec: SPEC } });

    await expect(readPersisted()).resolves.toEqual({ status: { step: 'accessRefused', spec: SPEC } });
  });

  it('keeps a polled order on disk so polling can resume after a crash', async () => {
    store.setState({ status: { step: 'polling', orderId: PROCESSING_ORDER.id, order: PROCESSING_ORDER, submittedAt: SUBMITTED_AT } });

    await expect(readPersisted()).resolves.toEqual({
      status: { step: 'polling', orderId: PROCESSING_ORDER.id, order: PROCESSING_ORDER, submittedAt: SUBMITTED_AT },
    });
  });

  const terminalStatuses: { label: string; status: CashBuyStatus }[] = [
    { label: 'success', status: { step: 'success', order: COMPLETED_ORDER } },
    { label: 'error', status: { step: 'error', errorCode: 'GENERIC', order: FAILED_PAYMENT_ORDER } },
    { label: 'notPlaced', status: { step: 'notPlaced', spec: SPEC } },
  ];

  it.each(terminalStatuses)('collapses a terminal $label status to idle on disk', async ({ status }) => {
    store.setState({ status });

    await expect(readPersisted()).resolves.toEqual({ status: { step: 'idle' } });
  });
});
