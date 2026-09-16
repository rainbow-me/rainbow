import { analytics } from '@/analytics';
import { logger } from '@/logger';

import { signInWithPhone } from '../../../services/cashSignInService';
import { createUserWithPhone, startRecovery, startSignupResume, type CreateUserWithPhoneResult } from '../../../services/userClient';
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
      cashExistingAccountRecoverySelected: 'cash.existing_account_recovery_selected',
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
  startRecovery: jest.fn(),
  startSignupResume: jest.fn(),
  verifyPhone: jest.fn(),
}));

jest.mock('../../../services/cashSignInService', () => ({
  signInWithPhone: jest.fn(),
}));

jest.mock('../../../services/cashPasskeyService', () => ({
  isPasskeyCancellation: jest.fn((error: unknown) => error instanceof Error && error.message === 'UserCancelled'),
}));

const mockCreateUserWithPhone = jest.mocked(createUserWithPhone);
const mockStartRecovery = jest.mocked(startRecovery);
const mockStartSignupResume = jest.mocked(startSignupResume);
const mockSignInWithPhone = jest.mocked(signInWithPhone);
const track = jest.mocked(analytics.track);

const DIGITS = '4155550100';
const RESPONSE: Extract<CreateUserWithPhoneResult, { outcome: 'created' }> = {
  outcome: 'created',
  userId: 'user-1',
  resendAfter: 1_750_000_030_000,
};

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

  it('shows the existing-account prompt for a phone registered with a passkey, without starting recovery', async () => {
    mockCreateUserWithPhone.mockResolvedValue({ outcome: 'registeredWithPasskey' });
    flow().setDigits(DIGITS);

    await expect(flow().submit()).resolves.toBe(false);

    expect(mockStartRecovery).not.toHaveBeenCalled();
    expect(session().status).toBe('empty');
    expect(track).toHaveBeenCalledWith('cash.phone_already_registered', { outcome: 'registeredWithPasskey' });
    expect(flow().state).toBe('existingAccount');

    flow().setDigits('415');
    expect(flow().state).toBe('entry');
  });

  it('shows the already-registered message only for the ambiguous outcome', async () => {
    mockCreateUserWithPhone.mockResolvedValue({ outcome: 'alreadyRegistered' });
    flow().setDigits(DIGITS);

    await expect(flow().submit()).resolves.toBe(false);

    expect(flow().state).toBe('entry');
    expect(session()).toEqual({ status: 'phoneAlreadyRegistered', phoneNationalNumber: DIGITS });
    expect(track).toHaveBeenCalledWith('cash.phone_already_registered', { outcome: 'alreadyRegistered' });

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

describe('useSubmitPhoneFlowStore.signInWithExistingPasskey', () => {
  beforeEach(() => {
    useSubmitPhoneFlowStore.setState({ state: 'existingAccount', digits: DIGITS });
  });

  it('does nothing outside the existing-account prompt', async () => {
    useSubmitPhoneFlowStore.setState({ state: 'entry' });

    await expect(flow().signInWithExistingPasskey()).resolves.toBe('failed');
    expect(mockSignInWithPhone).not.toHaveBeenCalled();
  });

  it('signs in with the submitted phone number, tagging the trigger, and leaves the prompt state', async () => {
    mockSignInWithPhone.mockResolvedValue(undefined);

    await expect(flow().signInWithExistingPasskey()).resolves.toBe('signedIn');

    expect(mockSignInWithPhone).toHaveBeenCalledWith(DIGITS, 'existingAccountPrompt');
    expect(flow().state).toBe('entry');
  });

  it('ignores a late success once the flow is abandoned (e.g. setup dismissed) mid ceremony', async () => {
    let resolveSignIn!: () => void;
    mockSignInWithPhone.mockReturnValue(
      new Promise<void>(resolve => {
        resolveSignIn = resolve;
      })
    );

    const pending = flow().signInWithExistingPasskey();
    expect(flow().state).toBe('signingIn');

    flow().reset();
    resolveSignIn();

    await expect(pending).resolves.toBe('cancelled');
    // reset()'s state must survive: the late success must not overwrite it.
    expect(flow().state).toBe('entry');
    expect(flow().digits).toBe('');
  });

  it('returns to the prompt without starting recovery when the passkey ceremony is cancelled', async () => {
    mockSignInWithPhone.mockRejectedValue(new Error('UserCancelled'));

    await expect(flow().signInWithExistingPasskey()).resolves.toBe('cancelled');

    expect(mockStartRecovery).not.toHaveBeenCalled();
    expect(flow().state).toBe('existingAccount');
  });

  it('returns to the prompt without starting recovery when the passkey ceremony fails', async () => {
    mockSignInWithPhone.mockRejectedValue(new Error('network down'));

    await expect(flow().signInWithExistingPasskey()).resolves.toBe('failed');

    expect(mockStartRecovery).not.toHaveBeenCalled();
    expect(flow().state).toBe('existingAccount');
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('useSubmitPhoneFlowStore.chooseRecovery', () => {
  beforeEach(() => {
    useSubmitPhoneFlowStore.setState({ state: 'existingAccount', digits: DIGITS });
  });

  it('does nothing outside the existing-account prompt', async () => {
    useSubmitPhoneFlowStore.setState({ state: 'entry' });

    await expect(flow().chooseRecovery()).resolves.toBe(false);
    expect(mockStartRecovery).not.toHaveBeenCalled();
  });

  it('starts account recovery, tracks the explicit selection, and stores the recovery session', async () => {
    mockStartRecovery.mockResolvedValue({ recoveryId: 'recovery-1', resendAfter: 1_750_000_060_000 });

    await expect(flow().chooseRecovery()).resolves.toBe(true);

    expect(mockStartRecovery).toHaveBeenCalledWith({ nationalNumber: DIGITS });
    expect(session()).toEqual({
      status: 'recovery',
      challenge: { kind: 'recovery', recoveryId: 'recovery-1' },
      phoneNationalNumber: DIGITS,
      resendAfter: 1_750_000_060_000,
      identity: { firstName: '', lastName: '', dateOfBirth: null },
      ssnLast4: '',
    });
    expect(track).toHaveBeenCalledWith('cash.existing_account_recovery_selected');
    expect(track).toHaveBeenCalledWith('cash.phone_submitted', { mode: 'recovery' });
    expect(flow().state).toBe('entry');
  });

  it('reports a generic failure when starting recovery throws', async () => {
    mockStartRecovery.mockRejectedValue(new Error('network down'));

    await expect(flow().chooseRecovery()).resolves.toBe(false);

    expect(flow().state).toBe('error');
    expect(session().status).toBe('empty');
    expect(track).toHaveBeenCalledWith('cash.phone_submit_failed', { reason: 'unknown' });
    expect(logger.error).toHaveBeenCalled();
  });

  it('ignores a late recovery start once the flow is abandoned, without writing the abandoned challenge into the session', async () => {
    let resolveStartRecovery!: (value: { recoveryId: string; resendAfter: number }) => void;
    mockStartRecovery.mockReturnValue(
      new Promise(resolve => {
        resolveStartRecovery = resolve;
      })
    );

    const pending = flow().chooseRecovery();
    expect(flow().state).toBe('submitting');

    flow().reset();
    resolveStartRecovery({ recoveryId: 'recovery-1', resendAfter: 1_750_000_060_000 });

    await expect(pending).resolves.toBe(false);
    // The abandoned flow's challenge must never reach the session a later flow inherits.
    expect(session().status).toBe('empty');
    expect(flow().state).toBe('entry');
  });
});
