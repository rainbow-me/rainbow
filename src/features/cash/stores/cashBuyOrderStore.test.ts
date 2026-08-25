import { analytics } from '@/analytics';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { logger } from '@/logger';
import { pendingTransactionsActions } from '@/state/pendingTransactions';

import { CASH_BUY_DESTINATION_ASSET } from '../constants';
import {
  OrderFailureReason,
  OrderStatus,
  createBuyOrder as rampCreateBuyOrder,
  RampCryptoAsset,
  getOrder as rampGetOrder,
  RampNetwork,
  type BuyOrder,
  type BuyOrderSpec,
  type CreatedBuyOrder,
  type TerminalBuyOrder,
} from '../services/rampClient';
import { buildCashPurchaseTransaction } from '../utils/buildCashPurchaseTransaction';
import { cashBuyOrderActions, selectCashBuyPhase, useCashBuyOrderStore, type CashBuyStatus } from './cashBuyOrderStore';
import { useCashWalletStore } from './cashWalletStore';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: {
      cashBuyOrderSubmitted: 'cash.buy_submitted',
      cashBuyOrderCompleted: 'cash.buy_completed',
      cashBuyOrderFailed: 'cash.buy_failed',
    },
  },
}));

jest.mock('@/features/local-auth/legacyKeychain', () => ({}));

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('../services/rampClient', () => ({
  ...jest.requireActual('../services/rampClient'),
  createBuyOrder: jest.fn(),
  getOrder: jest.fn(),
}));

let mockUuidCounter = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => {
    mockUuidCounter += 1;
    return `order-${mockUuidCounter}`;
  }),
}));

jest.mock('@/state/pendingTransactions', () => ({
  pendingTransactionsActions: { addPendingTransaction: jest.fn() },
}));

jest.mock('../utils/buildCashPurchaseTransaction', () => ({
  buildCashPurchaseTransaction: jest.fn(),
}));

const createBuyOrder = rampCreateBuyOrder as jest.Mock;
const getOrder = rampGetOrder as jest.Mock;
const addPendingTransaction = pendingTransactionsActions.addPendingTransaction as jest.Mock;
const buildPurchaseTransaction = buildCashPurchaseTransaction as jest.Mock;
const track = analytics.track as jest.Mock;

const PURCHASE_TRANSACTION = { hash: '0xtx', type: 'purchase' };

// ---- Fixtures --------------------------------------------------------------

// The client submits the checksummed account address; the ramp echoes it back lowercased. Both forms are
// fixtures on purpose — an all-lowercase address cannot express the difference the store has to reconcile.
const WALLET_ADDRESS = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const RAMP_WALLET_ADDRESS = WALLET_ADDRESS.toLowerCase();

const SPEC: BuyOrderSpec = { cardId: 'card-1', depositAmount: '50', id: 'order-1', walletAddress: WALLET_ADDRESS };
const SUBMITTED_AT = 1750789885000;
const CREATED_PENDING_ORDER: CreatedBuyOrder = {
  id: SPEC.id,
  status: OrderStatus.Pending,
  createdTime: '2026-06-24T18:31:25.000Z',
};
const CREATED_COMPLETED_ORDER: CreatedBuyOrder = { ...CREATED_PENDING_ORDER, status: OrderStatus.Completed };

const ORDER_COMMON = {
  id: 'order-1',
  cryptoAmount: { amount: '50', asset: { asset: RampCryptoAsset.USDC, network: RampNetwork.Base } },
  fiatAmount: { amount: '50', currency: 'USD' },
  createdTime: '2026-06-24T18:31:25.000Z',
  walletAddress: RAMP_WALLET_ADDRESS,
};
const PENDING_ORDER: Exclude<BuyOrder, TerminalBuyOrder> = { ...ORDER_COMMON, status: OrderStatus.Pending };
const PROCESSING_ORDER: Exclude<BuyOrder, TerminalBuyOrder> = { ...ORDER_COMMON, status: OrderStatus.Processing };
const COMPLETED_ORDER: Extract<BuyOrder, { status: OrderStatus.Completed }> = {
  ...ORDER_COMMON,
  status: OrderStatus.Completed,
  transactionHash: '0xtx',
  completedTime: '2026-06-24T18:31:31.000Z',
};
const FAILED_PAYMENT_ORDER: Extract<BuyOrder, { status: OrderStatus.Failed }> = {
  ...ORDER_COMMON,
  status: OrderStatus.Failed,
  failureReason: OrderFailureReason.PaymentRejected,
};

const SUBMIT_INPUT = { cardId: 'card-1', depositAmount: '50', walletAddress: WALLET_ADDRESS };
const LINKED_WALLET = { id: 'wallet-1', address: RAMP_WALLET_ADDRESS };

function fetchError(status: number): RainbowFetchError {
  return new RainbowFetchError({ message: 'not found', response: { status } as Response });
}

const store = useCashBuyOrderStore;
const getState = () => store.getState();
const phase = () => selectCashBuyPhase(getState());

beforeEach(() => {
  jest.clearAllMocks();
  mockUuidCounter = 0;
  store.setState({ status: { step: 'idle' } });
  useCashWalletStore.getState().clear();
  buildPurchaseTransaction.mockReturnValue(PURCHASE_TRANSACTION);
});

// ---------------------------------------------------------------------------

describe('submitBuyOrder', () => {
  it('rounds the amount before tracking a submitted order', async () => {
    await getState().submitBuyOrder({ ...SUBMIT_INPUT, depositAmount: '123.456789' });

    expect(track).toHaveBeenCalledWith(analytics.event.cashBuyOrderSubmitted, { amount: 123 });
    expect(createBuyOrder).not.toHaveBeenCalled();
  });

  it('builds a spec for the watcher to submit', async () => {
    createBuyOrder.mockResolvedValue(CREATED_PENDING_ORDER);

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder).not.toHaveBeenCalled();
    expect(getState().status).toEqual({ step: 'submitting', spec: SPEC, submittedAt: expect.any(Number) });

    await getState().resumePendingSubmission();

    expect(createBuyOrder).toHaveBeenCalledWith({ ...SPEC, cryptoAsset: CASH_BUY_DESTINATION_ASSET });
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: null, submittedAt: expect.any(Number) });
    expect(phase()).toBe('pending');
  });

  it('fetches full details before applying a terminal status returned by an idempotent create replay', async () => {
    createBuyOrder.mockResolvedValue(CREATED_COMPLETED_ORDER);
    getOrder.mockResolvedValue(COMPLETED_ORDER);

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await getState().resumePendingSubmission();

    expect(phase()).toBe('pending');
    expect(addPendingTransaction).not.toHaveBeenCalled();

    await getState().syncActiveOrder();

    expect(getOrder).toHaveBeenCalledWith(CREATED_COMPLETED_ORDER.id, expect.any(AbortController));
    expect(addPendingTransaction).toHaveBeenCalled();
    expect(phase()).toBe('success');
  });

  it('surfaces a GENERIC error when the backend definitively rejects order creation', async () => {
    createBuyOrder.mockRejectedValue(fetchError(422));

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await getState().resumePendingSubmission();

    expect(logger.error).toHaveBeenCalled();
    expect(getState().status).toEqual({ step: 'error', errorCode: 'GENERIC', order: null });
    expect(phase()).toBe('error');
  });

  it('replays the same order id when resuming after an ambiguous failure', async () => {
    createBuyOrder.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce(CREATED_PENDING_ORDER);

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await expect(getState().resumePendingSubmission()).rejects.toThrow('network down');

    expect(getOrder).not.toHaveBeenCalled();
    expect(createBuyOrder).toHaveBeenCalledTimes(1);
    expect(getState().status).toEqual({ step: 'submitting', spec: SPEC, submittedAt: expect.any(Number) });

    await getState().resumePendingSubmission();

    expect(createBuyOrder).toHaveBeenCalledTimes(2);
    expect(createBuyOrder.mock.calls[1][0].id).toBe(SPEC.id);
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: null, submittedAt: expect.any(Number) });
  });

  it('keeps the submission pending when a resumed replay also fails ambiguously', async () => {
    createBuyOrder.mockRejectedValue(new Error('network down'));

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await expect(getState().resumePendingSubmission()).rejects.toThrow('network down');
    await expect(cashBuyOrderActions.resumePendingSubmission()).rejects.toThrow('network down');

    expect(createBuyOrder).toHaveBeenCalledTimes(2);
    expect(getState().status).toEqual({ step: 'submitting', spec: SPEC, submittedAt: expect.any(Number) });
    expect(track).not.toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, expect.anything());
    expect(phase()).toBe('pending');
  });

  it('generates a fresh order id when retrying after a definitive backend rejection', async () => {
    createBuyOrder.mockRejectedValueOnce(fetchError(422)).mockResolvedValueOnce({ ...CREATED_PENDING_ORDER, id: 'order-2' });

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await getState().resumePendingSubmission();
    expect(getState().status).toEqual({ step: 'error', errorCode: 'GENERIC', order: null });

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await getState().resumePendingSubmission();
    expect(createBuyOrder.mock.calls[1][0].id).toBe('order-2');
  });

  // A 404 is the only handle the ramp surface gives on "the wallet you named is not linked", so it
  // is the one failure that invalidates the cache. Every other failure leaves it alone.
  const cacheOutcomes: { label: string; failure: unknown; cleared: boolean; expectedPhase: 'error' | 'pending' }[] = [
    { label: 'a 404', failure: fetchError(404), cleared: true, expectedPhase: 'error' },
    { label: 'a 408', failure: fetchError(408), cleared: false, expectedPhase: 'pending' },
    { label: 'a 429', failure: fetchError(429), cleared: false, expectedPhase: 'pending' },
    { label: 'a 500', failure: fetchError(500), cleared: false, expectedPhase: 'pending' },
    { label: 'a transport error with no response', failure: new Error('network down'), cleared: false, expectedPhase: 'pending' },
  ];

  it.each(cacheOutcomes)('$label leaves the linked-wallet cache cleared=$cleared', async ({ failure, cleared, expectedPhase }) => {
    useCashWalletStore.setState({ linkedWallets: [LINKED_WALLET] });
    createBuyOrder.mockRejectedValue(failure);

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await getState()
      .resumePendingSubmission()
      .catch(() => undefined);

    expect(useCashWalletStore.getState().linkedWallets).toEqual(cleared ? [] : [LINKED_WALLET]);
    expect(phase()).toBe(expectedPhase);
  });

  it('keeps the linked-wallet cache when the order is created', async () => {
    useCashWalletStore.setState({ linkedWallets: [LINKED_WALLET] });
    createBuyOrder.mockResolvedValue(CREATED_PENDING_ORDER);

    await getState().submitBuyOrder(SUBMIT_INPUT);
    await getState().resumePendingSubmission();

    expect(useCashWalletStore.getState().linkedWallets).toEqual([LINKED_WALLET]);
  });

  it('ignores a second submission while one is already in flight', async () => {
    let resolveOrder: (order: CreatedBuyOrder) => void = () => undefined;
    createBuyOrder.mockReturnValue(
      new Promise<CreatedBuyOrder>(resolve => {
        resolveOrder = resolve;
      })
    );

    await getState().submitBuyOrder(SUBMIT_INPUT);
    const inFlight = getState().resumePendingSubmission();
    await getState().submitBuyOrder(SUBMIT_INPUT); // guard sees 'pending' and returns immediately

    expect(createBuyOrder).toHaveBeenCalledTimes(1);

    resolveOrder(CREATED_PENDING_ORDER);
    await inFlight;
  });
});

describe('syncActiveOrder', () => {
  const startPolling = (order: Exclude<BuyOrder, TerminalBuyOrder>) =>
    store.setState({ status: { step: 'polling', orderId: order.id, order, submittedAt: SUBMITTED_AT } });

  it('advances the order to the next non-terminal status', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockResolvedValue(PROCESSING_ORDER);

    await getState().syncActiveOrder(new AbortController());

    expect(getOrder).toHaveBeenCalledWith(PENDING_ORDER.id, expect.any(AbortController));
    expect(getState().status).toEqual({ step: 'polling', orderId: PENDING_ORDER.id, order: PROCESSING_ORDER, submittedAt: SUBMITTED_AT });
    expect(phase()).toBe('pending');
  });

  // rainbowFetch arms its 30s timeout on the controller it receives, so handing it the watcher's
  // controller would let one hung request abort the whole poll loop.
  it('passes a request-scoped controller to getOrder, never the watcher controller itself', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockResolvedValue(PROCESSING_ORDER);
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
      })
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
    getOrder.mockResolvedValue(COMPLETED_ORDER);

    await getState().syncActiveOrder();

    expect(buildPurchaseTransaction).toHaveBeenCalledWith({ order: COMPLETED_ORDER, walletAddress: WALLET_ADDRESS });
    expect(addPendingTransaction).toHaveBeenCalledWith({
      address: WALLET_ADDRESS,
      pendingTransaction: PURCHASE_TRANSACTION,
    });
    expect(getState().status).toEqual({ step: 'success', order: COMPLETED_ORDER });
    expect(phase()).toBe('success');
  });

  it('rounds the fiat and crypto amounts before tracking a completed order', async () => {
    const completedOrder = {
      ...COMPLETED_ORDER,
      fiatAmount: { ...COMPLETED_ORDER.fiatAmount, amount: '123.456789' },
      cryptoAmount: { ...COMPLETED_ORDER.cryptoAmount, amount: '0.123456789' },
    };
    startPolling(PROCESSING_ORDER);
    getOrder.mockResolvedValue(completedOrder);

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
    getOrder.mockResolvedValue(COMPLETED_ORDER);

    await getState().syncActiveOrder();

    const { address } = addPendingTransaction.mock.calls[0][0];
    expect(address).toBe(WALLET_ADDRESS);
    expect(address).not.toBe(COMPLETED_ORDER.walletAddress);
  });

  it('surfaces a payment-rejected error when polling resolves to failed', async () => {
    startPolling(PROCESSING_ORDER);
    getOrder.mockResolvedValue(FAILED_PAYMENT_ORDER);

    await getState().syncActiveOrder();

    expect(getState().status).toEqual({ step: 'error', errorCode: 'PAYMENT_REJECTED', order: FAILED_PAYMENT_ORDER });
    expect(phase()).toBe('error');
  });

  it('keeps the current order and logs when polling throws', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockRejectedValue(new Error('timeout'));

    await getState().syncActiveOrder();

    expect(logger.error).toHaveBeenCalled();
    expect(getState().status).toMatchObject({ step: 'polling', order: PENDING_ORDER });
    expect(phase()).toBe('pending');
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

describe('resumePendingSubmission', () => {
  it('replays a rehydrated spec to (idempotently) recreate the order', async () => {
    // Mimics state restored from disk after a crash mid-submission: spec present, no order yet.
    store.setState({ status: { step: 'submitting', spec: SPEC, submittedAt: SUBMITTED_AT } });
    createBuyOrder.mockResolvedValue(CREATED_PENDING_ORDER);

    await getState().resumePendingSubmission();

    // same id ⇒ the backend replays, never re-creates
    expect(createBuyOrder).toHaveBeenCalledWith({ ...SPEC, cryptoAsset: CASH_BUY_DESTINATION_ASSET });
    expect(getState().status).toEqual({ step: 'polling', orderId: CREATED_PENDING_ORDER.id, order: null, submittedAt: SUBMITTED_AT });
    expect(phase()).toBe('pending');
  });

  it('returns to idle when the passkey prompt is cancelled', async () => {
    store.setState({ status: { step: 'submitting', spec: SPEC, submittedAt: SUBMITTED_AT } });
    createBuyOrder.mockRejectedValue(new Error('UserCancelled'));

    await getState().resumePendingSubmission();

    expect(logger.error).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, expect.anything());
    expect(getState().status).toEqual({ step: 'idle' });
  });

  it('is a no-op when there is no pending spec', async () => {
    await getState().resumePendingSubmission(); // idle from beforeEach
    expect(createBuyOrder).not.toHaveBeenCalled();
  });
});

describe('an in-flight submission', () => {
  it('drops a result that lands after the submission was reset', async () => {
    let resolveCreate: (created: CreatedBuyOrder) => void = () => undefined;
    createBuyOrder.mockReturnValueOnce(
      new Promise<CreatedBuyOrder>(resolve => {
        resolveCreate = resolve;
      })
    );

    await getState().submitBuyOrder(SUBMIT_INPUT);
    const inFlight = getState().resumePendingSubmission();
    getState().reset();
    resolveCreate(CREATED_PENDING_ORDER);
    await inFlight;

    expect(getState().status).toEqual({ step: 'idle' });
  });

  it('drops a late success after a concurrent resume has advanced to polling', async () => {
    let resolveFirstCreate: (created: CreatedBuyOrder) => void = () => undefined;
    createBuyOrder
      .mockReturnValueOnce(
        new Promise<CreatedBuyOrder>(resolve => {
          resolveFirstCreate = resolve;
        })
      )
      .mockResolvedValueOnce(CREATED_PENDING_ORDER);
    store.setState({ status: { step: 'submitting', spec: SPEC, submittedAt: SUBMITTED_AT } });

    const firstResume = getState().resumePendingSubmission();
    await getState().resumePendingSubmission();
    getOrder.mockResolvedValue(PENDING_ORDER);
    await getState().syncActiveOrder();

    resolveFirstCreate(CREATED_PENDING_ORDER);
    await firstResume;

    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: PENDING_ORDER, submittedAt: SUBMITTED_AT });
  });

  it('drops a late failure after a concurrent resume has advanced to polling', async () => {
    let rejectFirstCreate: (error: RainbowFetchError) => void = () => undefined;
    createBuyOrder
      .mockReturnValueOnce(
        new Promise<CreatedBuyOrder>((_resolve, reject) => {
          rejectFirstCreate = reject;
        })
      )
      .mockResolvedValueOnce(CREATED_PENDING_ORDER);
    store.setState({ status: { step: 'submitting', spec: SPEC, submittedAt: SUBMITTED_AT } });

    const firstResume = getState().resumePendingSubmission();
    await getState().resumePendingSubmission();

    rejectFirstCreate(fetchError(422));
    await firstResume;

    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: null, submittedAt: SUBMITTED_AT });
    expect(track).not.toHaveBeenCalledWith(analytics.event.cashBuyOrderFailed, expect.anything());
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

  it('keeps a mid-flight submission on disk (crash-during-submission recovery) — and never methods', async () => {
    store.setState({ status: { step: 'submitting', spec: SPEC, submittedAt: SUBMITTED_AT } });

    const persisted = await readPersisted();
    expect(Object.keys(persisted)).toEqual(['status']);
    expect(persisted).toEqual({ status: { step: 'submitting', spec: SPEC, submittedAt: SUBMITTED_AT } });
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
  ];

  it.each(terminalStatuses)('collapses a terminal $label status to idle on disk', async ({ status }) => {
    store.setState({ status });

    await expect(readPersisted()).resolves.toEqual({ status: { step: 'idle' } });
  });
});
