import { logger } from '@/logger';

import { useCashAuthGateStore } from '../stores/cashAuthGateStore';
import { loadLinkedCards } from './cardListService';
import { openCashAuthGate, reauthenticateCashGate } from './cashAuthGateService';
import { isPasskeyCancellation } from './cashPasskeyService';
import { ensureAccessToken } from './cashSignInService';

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('./cardListService', () => ({
  loadLinkedCards: jest.fn(),
}));

jest.mock('./cashPasskeyService', () => ({
  isPasskeyCancellation: jest.fn(),
}));

jest.mock('./cashSignInService', () => ({
  ensureAccessToken: jest.fn(),
}));

const mockLoadLinkedCards = jest.mocked(loadLinkedCards);
const mockEnsureAccessToken = jest.mocked(ensureAccessToken);
const mockIsPasskeyCancellation = jest.mocked(isPasskeyCancellation);

const LOAD_CARDS = { kind: 'loadCards' } as const;

const gate = () => useCashAuthGateStore.getState().status;

function deferLoadCards() {
  let settle!: (result: { error?: unknown; result?: 'completed' | 'authRequired' }) => void;
  const pending = new Promise<{ error?: unknown; result?: 'completed' | 'authRequired' }>(resolve => {
    settle = resolve;
  });
  mockLoadLinkedCards.mockImplementationOnce(async () => {
    const { error, result } = await pending;
    if (error) throw error;
    return result ?? 'completed';
  });
  return settle;
}

function deferCeremony() {
  let settle!: (result: { error?: unknown }) => void;
  const pending = new Promise<{ error?: unknown }>(resolve => {
    settle = resolve;
  });
  mockEnsureAccessToken.mockImplementation(async () => {
    const { error } = await pending;
    if (error) throw error;
    return 'token';
  });
  return settle;
}

beforeEach(() => {
  jest.clearAllMocks();
  useCashAuthGateStore.getState().clear();
  mockEnsureAccessToken.mockResolvedValue('token');
  mockLoadLinkedCards.mockResolvedValue('completed');
  mockIsPasskeyCancellation.mockReturnValue(false);
});

describe('openCashAuthGate', () => {
  it('runs the continuation and leaves the gate closed when it succeeds', async () => {
    useCashAuthGateStore.getState().park(LOAD_CARDS);

    await openCashAuthGate();

    expect(gate()).toEqual({ step: 'closed' });
    expect(mockLoadLinkedCards).toHaveBeenCalledTimes(1);
    expect(mockEnsureAccessToken).not.toHaveBeenCalled();
  });

  it('parks the intent when the continuation needs a fresh sign-in', async () => {
    mockLoadLinkedCards.mockResolvedValue('authRequired');

    await openCashAuthGate();

    expect(gate()).toEqual({ step: 'authRequired', intent: LOAD_CARDS });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('fails the gate when the continuation fails', async () => {
    mockLoadLinkedCards.mockRejectedValue(new Error('network down'));

    await openCashAuthGate();

    expect(gate()).toEqual({ step: 'error', intent: LOAD_CARDS });
    expect(logger.error).toHaveBeenCalled();
  });

  it('leaves a gate that was cleared mid-run alone, whether the run parks or fails', async () => {
    const settlePark = deferLoadCards();
    const parked = openCashAuthGate();
    useCashAuthGateStore.getState().clear();
    settlePark({ result: 'authRequired' });
    await parked;
    expect(gate()).toEqual({ step: 'closed' });

    const settleFailure = deferLoadCards();
    const failed = openCashAuthGate();
    useCashAuthGateStore.getState().clear();
    settleFailure({ error: new Error('network down') });
    await failed;
    expect(gate()).toEqual({ step: 'closed' });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});

describe('reauthenticateCashGate', () => {
  beforeEach(() => {
    useCashAuthGateStore.getState().park(LOAD_CARDS);
  });

  it('does nothing when the gate is closed', async () => {
    useCashAuthGateStore.getState().clear();

    await reauthenticateCashGate();

    expect(mockEnsureAccessToken).not.toHaveBeenCalled();
    expect(mockLoadLinkedCards).not.toHaveBeenCalled();
  });

  it('runs one ceremony, then the parked intent continues', async () => {
    await reauthenticateCashGate();

    expect(mockEnsureAccessToken).toHaveBeenCalledWith('addCash');
    expect(gate()).toEqual({ step: 'closed' });
    expect(mockLoadLinkedCards).toHaveBeenCalledTimes(1);

    const [ceremonyOrder] = mockEnsureAccessToken.mock.invocationCallOrder;
    const [continuationOrder] = mockLoadLinkedCards.mock.invocationCallOrder;
    expect(ceremonyOrder).toBeLessThan(continuationOrder);
  });

  it('stays parked silently when the ceremony is cancelled', async () => {
    mockEnsureAccessToken.mockRejectedValue(new Error('user cancelled'));
    mockIsPasskeyCancellation.mockReturnValue(true);

    await reauthenticateCashGate();

    expect(gate()).toEqual({ step: 'authRequired', intent: LOAD_CARDS });
    expect(mockLoadLinkedCards).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('fails the gate when the ceremony fails', async () => {
    mockEnsureAccessToken.mockRejectedValue(new Error('sign-in exploded'));

    await reauthenticateCashGate();

    expect(gate()).toEqual({ step: 'error', intent: LOAD_CARDS });
    expect(mockLoadLinkedCards).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });

  it('re-parks when the continuation still needs a fresh sign-in after the ceremony', async () => {
    mockLoadLinkedCards.mockResolvedValue('authRequired');

    await reauthenticateCashGate();

    expect(gate()).toEqual({ step: 'authRequired', intent: LOAD_CARDS });
  });

  it('retries from the error state', async () => {
    mockEnsureAccessToken.mockRejectedValueOnce(new Error('sign-in exploded'));

    await reauthenticateCashGate();
    expect(gate()).toEqual({ step: 'error', intent: LOAD_CARDS });

    await reauthenticateCashGate();
    expect(gate()).toEqual({ step: 'closed' });
    expect(mockLoadLinkedCards).toHaveBeenCalledTimes(1);
  });

  it('lets a tap on a reopened sheet finish its own gate while the dismissed sheet stays silent', async () => {
    const settle = deferCeremony();
    const dismissed = reauthenticateCashGate();
    useCashAuthGateStore.getState().clear();

    useCashAuthGateStore.getState().park(LOAD_CARDS);
    const reopened = reauthenticateCashGate();

    settle({});
    await Promise.all([dismissed, reopened]);
    expect(gate()).toEqual({ step: 'closed' });
    expect(mockLoadLinkedCards).toHaveBeenCalledTimes(1);
  });

  it('leaves a gate that was cleared during the ceremony alone, whether it succeeds or fails', async () => {
    const settleSuccess = deferCeremony();
    const succeeded = reauthenticateCashGate();
    useCashAuthGateStore.getState().clear();
    settleSuccess({});
    await succeeded;
    expect(gate()).toEqual({ step: 'closed' });
    expect(mockLoadLinkedCards).not.toHaveBeenCalled();

    useCashAuthGateStore.getState().park(LOAD_CARDS);
    const settleFailure = deferCeremony();
    const failed = reauthenticateCashGate();
    useCashAuthGateStore.getState().clear();
    settleFailure({ error: new Error('sign-in exploded') });
    await failed;
    expect(gate()).toEqual({ step: 'closed' });
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
