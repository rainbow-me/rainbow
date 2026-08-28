import { analytics } from '@/analytics';
import { logger } from '@/logger';

import { createUserWithPhone, startSignupResume } from '../../../services/userClient';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore } from '../../../stores/verifyPhoneFlowStore';
import { useSubmitPhoneFlowStore } from './useSubmitPhoneFlow';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: {
      cashPhoneSubmitted: 'cash.phone_submitted',
      cashPhoneSubmitFailed: 'cash.phone_submit_failed',
      cashPhoneAlreadyRegistered: 'cash.phone_already_registered',
    },
  },
}));

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('../../../services/userClient', () => ({
  US_COUNTRY_CALLING_CODE: '1',
  createUserWithPhone: jest.fn(),
  resendPhoneCode: jest.fn(),
  startSignupResume: jest.fn(),
  verifyPhone: jest.fn(),
}));

const mockCreateUserWithPhone = createUserWithPhone as jest.Mock;
const mockStartSignupResume = startSignupResume as jest.Mock;
const track = analytics.track as jest.Mock;

const DIGITS = '4155550100';
const RESPONSE = { outcome: 'created', userId: 'user-1', resendAfter: 1_750_000_030_000 };

const flow = () => useSubmitPhoneFlowStore.getState();
const session = () => useCashSetupSessionStore.getState().session;

beforeEach(() => {
  jest.clearAllMocks();
  useCashSetupSessionStore.getState().reset();
  useSubmitPhoneFlowStore.setState({ state: 'entry', digits: '' });
  useVerifyPhoneFlowStore.getState().reset();
  mockCreateUserWithPhone.mockResolvedValue(RESPONSE);
});

describe('useSubmitPhoneFlowStore.setDigits', () => {
  const cases = [
    { input: '4155550100', expected: '4155550100' },
    { input: '(415) 555-0100', expected: '4155550100' },
    { input: '+14155550100', expected: '4155550100' },
    { input: '+1 (415) 555-0100', expected: '4155550100' },
    { input: '14155550100', expected: '4155550100' },
    { input: '1234567890', expected: '1234567890' },
    { input: '(415) 555-01004', expected: '4155550100' },
  ];

  it.each(cases)('normalizes $input to $expected', ({ input, expected }) => {
    flow().setDigits(input);
    expect(flow().digits).toBe(expected);
  });
});

describe('useSubmitPhoneFlowStore.reset', () => {
  it('clears an already-registered phone result', () => {
    useCashSetupSessionStore.getState().setPhoneAlreadyRegistered(DIGITS);

    flow().reset();

    expect(session().status).toBe('empty');
  });
});

describe('useSubmitPhoneFlowStore.submit', () => {
  it('creates the user, stores the submitted phone session, and tracks', async () => {
    flow().setDigits(DIGITS);

    await expect(flow().submit()).resolves.toBe(true);

    expect(mockCreateUserWithPhone).toHaveBeenCalledWith({ nationalNumber: DIGITS });
    expect(session()).toEqual({
      status: 'phoneSubmitted',
      challenge: { kind: 'signup', userId: RESPONSE.userId },
      phoneNationalNumber: DIGITS,
      resendAfter: RESPONSE.resendAfter,
    });
    expect(track).toHaveBeenCalledWith('cash.phone_submitted', { mode: 'signup' });
    expect(flow().state).toBe('entry');
    expect(flow().digits).toBe(DIGITS);
  });

  it('starts a signup resume for a phone registered without a passkey', async () => {
    mockCreateUserWithPhone.mockResolvedValue({ outcome: 'registeredWithoutPasskey' });
    mockStartSignupResume.mockResolvedValue({ resumeId: 'rcv_1', resendAfter: 1_750_000_060_000 });
    flow().setDigits(DIGITS);

    await expect(flow().submit()).resolves.toBe(true);

    expect(mockStartSignupResume).toHaveBeenCalledWith({ nationalNumber: DIGITS });
    expect(session()).toEqual({
      status: 'phoneSubmitted',
      challenge: { kind: 'resume', resumeId: 'rcv_1' },
      phoneNationalNumber: DIGITS,
      resendAfter: 1_750_000_060_000,
    });
    expect(track).toHaveBeenCalledWith('cash.phone_submitted', { mode: 'resume' });
    expect(flow().state).toBe('entry');
  });

  it('reports a generic failure when starting the resume throws', async () => {
    mockCreateUserWithPhone.mockResolvedValue({ outcome: 'registeredWithoutPasskey' });
    mockStartSignupResume.mockRejectedValue(new Error('network down'));
    flow().setDigits(DIGITS);

    await expect(flow().submit()).resolves.toBe(false);

    expect(flow().state).toBe('error');
    expect(session().status).toBe('empty');
    expect(track).toHaveBeenCalledWith('cash.phone_submit_failed', { reason: 'unknown' });
    expect(track).not.toHaveBeenCalledWith('cash.phone_submitted', expect.anything());
    expect(logger.error).toHaveBeenCalled();
  });

  it.each(['registeredWithPasskey', 'alreadyRegistered'])('shows the already-registered message on the %s outcome', async outcome => {
    mockCreateUserWithPhone.mockResolvedValue({ outcome });
    flow().setDigits(DIGITS);

    await expect(flow().submit()).resolves.toBe(false);

    expect(flow().state).toBe('entry');
    expect(session()).toEqual({ status: 'phoneAlreadyRegistered', phoneNationalNumber: DIGITS });
    expect(track).toHaveBeenCalledWith('cash.phone_already_registered', { outcome });

    flow().setDigits('415');
    expect(flow().state).toBe('entry');
    expect(session().status).toBe('empty');
  });

  it('drops any code/error left in the confirm step so a resubmitted phone starts fresh', async () => {
    useVerifyPhoneFlowStore.getState().setCode('123456');
    flow().setDigits(DIGITS);

    await flow().submit();

    expect(useVerifyPhoneFlowStore.getState().code).toBe('');
    expect(useVerifyPhoneFlowStore.getState().state).toBe('entry');
  });

  it('keeps the digits, stores no session, and reports the failure when creation throws', async () => {
    mockCreateUserWithPhone.mockRejectedValue(new Error('network down'));
    flow().setDigits(DIGITS);

    await expect(flow().submit()).resolves.toBe(false);

    expect(flow().state).toBe('error');
    expect(flow().digits).toBe(DIGITS);
    expect(session().status).toBe('empty');
    expect(track).toHaveBeenCalledWith('cash.phone_submit_failed', { reason: 'unknown' });
    expect(track).not.toHaveBeenCalledWith('cash.phone_submitted', expect.anything());
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns to entry when the digits are edited after an error', async () => {
    mockCreateUserWithPhone.mockRejectedValue(new Error('network down'));
    flow().setDigits(DIGITS);
    await flow().submit();
    expect(flow().state).toBe('error');

    flow().setDigits('415');

    expect(flow().state).toBe('entry');
    expect(flow().digits).toBe('415');
  });

  it('advances without re-sending when a code is already out for the same number', async () => {
    flow().setDigits(DIGITS);
    await flow().submit();
    const pending = session();
    useVerifyPhoneFlowStore.setState({ state: 'error' });
    jest.clearAllMocks();

    await expect(flow().submit()).resolves.toBe(true);

    expect(mockCreateUserWithPhone).not.toHaveBeenCalled();
    expect(mockStartSignupResume).not.toHaveBeenCalled();
    expect(session()).toBe(pending);
    expect(track).not.toHaveBeenCalled();
    expect(useVerifyPhoneFlowStore.getState().state).toBe('entry');
  });

  it('sends a new code when the number is edited after a submit', async () => {
    const OTHER_DIGITS = '4155550199';
    flow().setDigits(DIGITS);
    await flow().submit();
    jest.clearAllMocks();
    mockCreateUserWithPhone.mockResolvedValue({ ...RESPONSE, userId: 'user-2' });

    flow().setDigits(OTHER_DIGITS);
    await expect(flow().submit()).resolves.toBe(true);

    expect(mockCreateUserWithPhone).toHaveBeenCalledWith({ nationalNumber: OTHER_DIGITS });
    expect(session()).toEqual({
      status: 'phoneSubmitted',
      challenge: { kind: 'signup', userId: 'user-2' },
      phoneNationalNumber: OTHER_DIGITS,
      resendAfter: RESPONSE.resendAfter,
    });
  });

  it('ignores an incomplete number', async () => {
    flow().setDigits('415555010');

    await expect(flow().submit()).resolves.toBe(false);

    expect(mockCreateUserWithPhone).not.toHaveBeenCalled();
    expect(flow().state).toBe('entry');
  });

  it('ignores a second submit while submitting', async () => {
    let resolveCreate!: (value: typeof RESPONSE) => void;
    mockCreateUserWithPhone.mockReturnValue(
      new Promise(resolve => {
        resolveCreate = resolve;
      })
    );
    flow().setDigits(DIGITS);

    const first = flow().submit();
    await expect(flow().submit()).resolves.toBe(false);

    expect(mockCreateUserWithPhone).toHaveBeenCalledTimes(1);
    resolveCreate(RESPONSE);
    await expect(first).resolves.toBe(true);
  });
});
