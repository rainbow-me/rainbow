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

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('../services/rampClient', () => ({
  ...jest.requireActual('../services/rampClient'),
  createBuyOrder: jest.fn(),
  getOrder: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'order-1'),
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

const PURCHASE_TRANSACTION = { hash: '0xtx', type: 'purchase' };

// ---- Fixtures --------------------------------------------------------------

const SPEC: BuyOrderSpec = { cardId: 'card-1', depositAmount: '50', id: 'order-1', walletAddress: '0xabc' };
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
  walletAddress: '0xabc',
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

const SUBMIT_INPUT = { cardId: 'card-1', depositAmount: '50', walletAddress: '0xabc' };
const LINKED_WALLET = { id: 'wallet-1', address: '0xabc' };

function fetchError(status: number): RainbowFetchError {
  return new RainbowFetchError({ message: 'not found', response: { status } as Response });
}

const store = useCashBuyOrderStore;
const getState = () => store.getState();
const phase = () => selectCashBuyPhase(getState());

beforeEach(() => {
  jest.clearAllMocks();
  store.setState({ status: { step: 'idle' } });
  useCashWalletStore.getState().clear();
  buildPurchaseTransaction.mockReturnValue(PURCHASE_TRANSACTION);
});

// ---------------------------------------------------------------------------

describe('submitBuyOrder', () => {
  it('builds a spec, creates the order, and surfaces the created order id as pending', async () => {
    createBuyOrder.mockResolvedValue(CREATED_PENDING_ORDER);

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrder).toHaveBeenCalledWith({ ...SPEC, cryptoAsset: CASH_BUY_DESTINATION_ASSET });
    expect(getState().status).toEqual({ step: 'polling', orderId: SPEC.id, order: null, submittedAt: expect.any(Number) });
    expect(phase()).toBe('pending');
  });

  it('fetches full details before applying a terminal status returned by an idempotent create replay', async () => {
    createBuyOrder.mockResolvedValue(CREATED_COMPLETED_ORDER);
    getOrder.mockResolvedValue(COMPLETED_ORDER);

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(phase()).toBe('pending');
    expect(addPendingTransaction).not.toHaveBeenCalled();

    await getState().syncActiveOrder();

    expect(getOrder).toHaveBeenCalledWith(CREATED_COMPLETED_ORDER.id, expect.any(AbortController));
    expect(addPendingTransaction).toHaveBeenCalled();
    expect(phase()).toBe('success');
  });

  it('surfaces a GENERIC error when order creation throws', async () => {
    createBuyOrder.mockRejectedValue(new Error('network down'));

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(logger.error).toHaveBeenCalled();
    expect(getState().status).toEqual({ step: 'error', errorCode: 'GENERIC', order: null });
    expect(phase()).toBe('error');
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

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(useCashWalletStore.getState().linkedWallets).toEqual(cleared ? [] : [LINKED_WALLET]);
    expect(phase()).toBe('error');
  });

  it('keeps the linked-wallet cache when the order is created', async () => {
    useCashWalletStore.setState({ linkedWallets: [LINKED_WALLET] });
    createBuyOrder.mockResolvedValue(CREATED_PENDING_ORDER);

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(useCashWalletStore.getState().linkedWallets).toEqual([LINKED_WALLET]);
  });

  it('ignores a second submission while one is already in flight', async () => {
    let resolveOrder: (order: CreatedBuyOrder) => void = () => undefined;
    createBuyOrder.mockReturnValue(
      new Promise<CreatedBuyOrder>(resolve => {
        resolveOrder = resolve;
      })
    );

    const inFlight = getState().submitBuyOrder(SUBMIT_INPUT); // sets 'submitting' → pending, then awaits createBuyOrder
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

    expect(buildPurchaseTransaction).toHaveBeenCalledWith({ order: COMPLETED_ORDER, walletAddress: COMPLETED_ORDER.walletAddress });
    expect(addPendingTransaction).toHaveBeenCalledWith({
      address: COMPLETED_ORDER.walletAddress,
      pendingTransaction: PURCHASE_TRANSACTION,
    });
    expect(getState().status).toEqual({ step: 'success', order: COMPLETED_ORDER });
    expect(phase()).toBe('success');
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

  it('is a no-op when there is no pending spec', async () => {
    await getState().resumePendingSubmission(); // idle from beforeEach
    expect(createBuyOrder).not.toHaveBeenCalled();
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
