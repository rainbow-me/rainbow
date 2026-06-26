import { Alert } from 'react-native';

import { logger } from '@/logger';

import { cashOrderService } from '../services/cashOrderService';
import { OrderFailureReason, OrderStatus, RampCryptoAsset, RampNetwork, type BuyOrder, type BuyOrderSpec } from '../services/rampClient';
import {
  cashBuyOrderActions,
  selectCashBuyPhase,
  useCashBuyOrderStore,
  type CashBuyErrorCode,
  type CashBuyPhase,
} from './cashBuyOrderStore';

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('../services/cashOrderService', () => ({
  cashOrderService: {
    createBuyOrder: jest.fn(),
    createBuyOrderSpec: jest.fn(),
    getOrder: jest.fn(),
  },
}));

const createBuyOrder = cashOrderService.createBuyOrder as jest.Mock;
const createBuyOrderSpec = cashOrderService.createBuyOrderSpec as jest.Mock;
const getOrder = cashOrderService.getOrder as jest.Mock;

// ---- Fixtures --------------------------------------------------------------

const SPEC: BuyOrderSpec = { depositAmount: '50', id: 'order-1', walletAddress: '0xabc' };

const ORDER_COMMON = {
  id: 'order-1',
  cryptoAmount: { amount: '50', asset: { asset: RampCryptoAsset.USDC, network: RampNetwork.Base } },
  fiatAmount: { amount: '50', currency: 'USD' },
  createdTime: '2026-06-24T18:31:25.000Z',
};
const PENDING_ORDER: BuyOrder = { ...ORDER_COMMON, status: OrderStatus.Pending };
const PROCESSING_ORDER: BuyOrder = { ...ORDER_COMMON, status: OrderStatus.Processing };
const COMPLETED_ORDER: BuyOrder = {
  ...ORDER_COMMON,
  status: OrderStatus.Completed,
  transactionHash: '0xtx',
  completedTime: '2026-06-24T18:31:31.000Z',
};
const FAILED_PAYMENT_ORDER: BuyOrder = { ...ORDER_COMMON, status: OrderStatus.Failed, failureReason: OrderFailureReason.PaymentRejected };
const FAILED_GENERIC_ORDER: BuyOrder = { ...ORDER_COMMON, status: OrderStatus.Failed, failureReason: OrderFailureReason.Unspecified };

const SUBMIT_INPUT = { depositAmount: '50', walletAddress: '0xabc' };

const store = useCashBuyOrderStore;
const getState = () => store.getState();
const phase = () => selectCashBuyPhase(getState());

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  store.setState({ spec: null, order: null, errorCode: null });
  createBuyOrderSpec.mockImplementation(({ depositAmount, walletAddress }) => ({ depositAmount, walletAddress, id: 'order-1' }));
});

// ---------------------------------------------------------------------------

describe('selectCashBuyPhase', () => {
  // Reads as a truth table: each row pins which (errorCode, spec, order) inputs produce which phase.
  const ORDERS = {
    none: null,
    pending: PENDING_ORDER,
    processing: PROCESSING_ORDER,
    completed: COMPLETED_ORDER,
    failed: FAILED_PAYMENT_ORDER,
  } satisfies Record<string, BuyOrder | null>;

  const cases: { errorCode: CashBuyErrorCode | null; spec: 'set' | 'null'; order: keyof typeof ORDERS; expected: CashBuyPhase }[] = [
    // errorCode is the highest-priority signal — it short-circuits spec and order entirely.
    { errorCode: 'GENERIC', /*         */ spec: 'null', order: 'none', /*      */ expected: 'error' },
    { errorCode: 'PAYMENT_REJECTED', /**/ spec: 'null', order: 'none', /*      */ expected: 'error' },
    { errorCode: 'GENERIC', /*         */ spec: 'set', /* */ order: 'none', /*      */ expected: 'error' },
    { errorCode: 'GENERIC', /*         */ spec: 'null', order: 'completed', /* */ expected: 'error' },
    // spec set + no order = a submission is in flight.
    { errorCode: null, /*              */ spec: 'set', /* */ order: 'none', /*      */ expected: 'pending' },
    // no spec, no error: the phase is a pure projection of the order's status.
    { errorCode: null, /*              */ spec: 'null', order: 'none', /*      */ expected: 'idle' },
    { errorCode: null, /*              */ spec: 'null', order: 'pending', /*   */ expected: 'pending' },
    { errorCode: null, /*              */ spec: 'null', order: 'processing', /**/ expected: 'pending' },
    { errorCode: null, /*              */ spec: 'null', order: 'completed', /* */ expected: 'success' },
    { errorCode: null, /*              */ spec: 'null', order: 'failed', /*    */ expected: 'error' },
  ];

  it.each(cases)('errorCode=$errorCode, spec=$spec, order=$order → $expected', ({ errorCode, spec, order, expected }) => {
    expect(selectCashBuyPhase({ errorCode, spec: spec === 'set' ? SPEC : null, order: ORDERS[order] })).toBe(expected);
  });

  it('logs and returns error for the impossible spec-and-order coexistence', () => {
    expect(selectCashBuyPhase({ errorCode: null, spec: SPEC, order: PENDING_ORDER })).toBe('error');

    expect(logger.error).toHaveBeenCalledTimes(1);
    const loggedError = (logger.error as jest.Mock).mock.calls[0][0] as Error;
    expect(loggedError.message).toContain('Impossible state');
  });
});

describe('submitBuyOrder', () => {
  it('builds a spec, creates the order, and surfaces a non-terminal order as pending', async () => {
    createBuyOrder.mockResolvedValue(PENDING_ORDER);

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(createBuyOrderSpec).toHaveBeenCalledWith(SUBMIT_INPUT);
    expect(createBuyOrder).toHaveBeenCalledWith(SPEC);
    expect(getState()).toMatchObject({ order: PENDING_ORDER, spec: null, errorCode: null });
    expect(phase()).toBe('pending');
  });

  // A created order that arrives already-terminal is stored verbatim: submit neither alerts nor maps an
  // error code. Terminal presentation is deferred to the phase projection (and, for ongoing orders, polling).
  const terminalOnCreate: { label: string; order: BuyOrder; expected: CashBuyPhase }[] = [
    { label: 'completed', order: COMPLETED_ORDER, expected: 'success' },
    { label: 'payment-rejected', order: FAILED_PAYMENT_ORDER, expected: 'error' },
    { label: 'generically failed', order: FAILED_GENERIC_ORDER, expected: 'error' },
  ];

  it.each(terminalOnCreate)('stores a created-$label order verbatim without alerting → $expected', async ({ order, expected }) => {
    createBuyOrder.mockResolvedValue(order);

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(alertSpy).not.toHaveBeenCalled();
    expect(getState()).toMatchObject({ spec: null, order, errorCode: null });
    expect(phase()).toBe(expected);
  });

  it('clears the spec and surfaces a GENERIC error when order creation throws', async () => {
    createBuyOrder.mockRejectedValue(new Error('network down'));

    await getState().submitBuyOrder(SUBMIT_INPUT);

    expect(logger.error).toHaveBeenCalled();
    expect(getState()).toMatchObject({ errorCode: 'GENERIC', order: null, spec: null });
    expect(phase()).toBe('error');
  });

  it('ignores a second submission while one is already in flight', async () => {
    let resolveOrder: (order: BuyOrder) => void = () => undefined;
    createBuyOrder.mockReturnValue(
      new Promise<BuyOrder>(resolve => {
        resolveOrder = resolve;
      })
    );

    const inFlight = getState().submitBuyOrder(SUBMIT_INPUT); // sets spec → pending, then awaits createBuyOrder
    await getState().submitBuyOrder(SUBMIT_INPUT); // guard sees 'pending' and returns immediately

    expect(createBuyOrderSpec).toHaveBeenCalledTimes(1);
    expect(createBuyOrder).toHaveBeenCalledTimes(1);

    resolveOrder(PENDING_ORDER);
    await inFlight;
  });
});

describe('syncActiveOrder', () => {
  const startPolling = (order: BuyOrder) => store.setState({ spec: null, order, errorCode: null });

  it('advances the order to the next non-terminal status', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockResolvedValue(PROCESSING_ORDER);

    await getState().syncActiveOrder();

    expect(getOrder).toHaveBeenCalledWith(PENDING_ORDER.id);
    expect(getState().order).toBe(PROCESSING_ORDER);
    expect(phase()).toBe('pending');
  });

  it('alerts and surfaces the order as success when polling resolves to completed', async () => {
    startPolling(PROCESSING_ORDER);
    getOrder.mockResolvedValue(COMPLETED_ORDER);

    await getState().syncActiveOrder();

    expect(alertSpy).toHaveBeenCalledWith('Request Successful');
    expect(getState()).toMatchObject({ spec: null, order: COMPLETED_ORDER, errorCode: null });
    expect(phase()).toBe('success');
  });

  it('surfaces a payment-rejected error when polling resolves to failed', async () => {
    startPolling(PROCESSING_ORDER);
    getOrder.mockResolvedValue(FAILED_PAYMENT_ORDER);

    await getState().syncActiveOrder();

    expect(getState()).toMatchObject({ errorCode: 'PAYMENT_REJECTED', order: FAILED_PAYMENT_ORDER });
    expect(phase()).toBe('error');
  });

  it('keeps the current order and logs when polling throws', async () => {
    startPolling(PENDING_ORDER);
    getOrder.mockRejectedValue(new Error('timeout'));

    await getState().syncActiveOrder();

    expect(logger.error).toHaveBeenCalled();
    expect(getState().order).toBe(PENDING_ORDER);
    expect(phase()).toBe('pending');
  });

  it('does nothing when there is no active order', async () => {
    await getState().syncActiveOrder(); // idle from beforeEach
    expect(getOrder).not.toHaveBeenCalled();
  });

  it('does nothing when the order has already reached a terminal status', async () => {
    store.setState({ spec: null, order: COMPLETED_ORDER, errorCode: null });
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
    store.setState({ spec: SPEC, order: null, errorCode: null });
    createBuyOrder.mockResolvedValue(PENDING_ORDER);

    await getState().resumePendingSubmission();

    expect(createBuyOrder).toHaveBeenCalledWith(SPEC); // same id ⇒ the backend replays, never re-creates
    expect(getState()).toMatchObject({ order: PENDING_ORDER, spec: null });
    expect(phase()).toBe('pending');
  });

  it('is a no-op when there is no pending spec', async () => {
    await getState().resumePendingSubmission(); // idle from beforeEach
    expect(createBuyOrder).not.toHaveBeenCalled();
  });
});

describe('reset', () => {
  it('returns the store to the idle initial state', () => {
    store.setState({ spec: SPEC, order: FAILED_PAYMENT_ORDER, errorCode: 'GENERIC' });

    getState().reset();

    expect(getState()).toMatchObject({ spec: null, order: null, errorCode: null });
    expect(phase()).toBe('idle');
  });

  it('is reachable through the exported actions bundle', () => {
    store.setState({ spec: SPEC, order: null, errorCode: 'GENERIC' });

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

  it('persists only spec and order — never the transient errorCode or any methods', async () => {
    store.setState({ spec: SPEC, order: PENDING_ORDER, errorCode: 'GENERIC' });

    const persisted = await readPersisted();
    expect(Object.keys(persisted).sort()).toEqual(['order', 'spec']);
    expect(persisted).toEqual({ spec: SPEC, order: PENDING_ORDER });
  });

  it('keeps the spec on disk while a submission is mid-flight (crash-during-submission recovery)', async () => {
    store.setState({ spec: SPEC, order: null, errorCode: null });

    await expect(readPersisted()).resolves.toEqual({ spec: SPEC, order: null });
  });

  it('keeps a non-terminal order on disk so polling can resume after a crash', async () => {
    store.setState({ spec: null, order: PROCESSING_ORDER, errorCode: null });

    await expect(readPersisted()).resolves.toEqual({ spec: null, order: PROCESSING_ORDER });
  });
});
