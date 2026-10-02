import { beforeEach, describe, expect, it, vi } from 'vitest';

import { analytics } from '@/analytics';
import { logger } from '@/logger';

import { createUsSsnLast4GovernmentId, isValidUsSsnLast4 } from '../../../services/cashSetupIdentityService';
import { finishRecovery, startRecovery, startSignupResume } from '../../../services/userClient';
import { useCashSetupSessionStore, type RecoveryPhoneChallenge } from '../../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore } from '../../../stores/verifyPhoneFlowStore';
import { useSubmitReviewFlowStore } from './useSubmitReviewFlow';

vi.mock('@/analytics', () => ({
  analytics: {
    track: vi.fn(),
    event: {
      cashPhoneSubmitted: 'cash.phone_submitted',
      cashPhoneVerified: 'cash.phone_verified',
      cashPhoneVerifyFailed: 'cash.phone_verify_failed',
    },
  },
}));

vi.mock('@/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  RainbowError: class RainbowError extends Error {},
}));

vi.mock('@/features/config/stores/remoteConfig', () => ({
  getRemoteConfig: () => ({ cash_kyc_review_delay_ms: 60_000 }),
}));

vi.mock('../../../services/userClient', () => ({
  finishRecovery: vi.fn(),
  startRecovery: vi.fn(),
  startSignupResume: vi.fn(),
}));

const mockFinishRecovery = vi.mocked(finishRecovery);
const mockStartRecovery = vi.mocked(startRecovery);
const mockStartSignupResume = vi.mocked(startSignupResume);
const track = vi.mocked(analytics.track);

const CODE = '123456';
const IDENTITY = { firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: { year: 1815, month: 12, day: 10 } };
const CHALLENGE: RecoveryPhoneChallenge = { kind: 'recovery', recoveryId: 'recovery-1' };
let token = { bootstrapToken: 'bst_recovered', expiresAt: 0 };
const RESEND_AFTER = 1_750_000_030_000;

const ssnLast4 = '1234';
if (!isValidUsSsnLast4(ssnLast4)) throw new Error('Invalid test SSN');
const GOVERNMENT_ID = createUsSsnLast4GovernmentId(ssnLast4);

const flow = () => useSubmitReviewFlowStore.getState();
const sessionStore = () => useCashSetupSessionStore.getState();
const verifyFlow = () => useVerifyPhoneFlowStore.getState();

beforeEach(() => {
  vi.clearAllMocks();
  flow().reset();
  sessionStore().reset();
  verifyFlow().reset();
  sessionStore().setPhoneSubmitted({ challenge: CHALLENGE, phoneNationalNumber: '4155550100', resendAfter: 0 });
  sessionStore().setFirstName(IDENTITY.firstName);
  sessionStore().setLastName(IDENTITY.lastName);
  sessionStore().setDateOfBirth(IDENTITY.dateOfBirth);
  sessionStore().setSsnLast4(ssnLast4);
  verifyFlow().setCode(CODE);
  token = { bootstrapToken: 'bst_recovered', expiresAt: Date.now() + 60_000 };
  mockFinishRecovery.mockResolvedValue({ outcome: 'recovered', ...token });
  mockStartRecovery.mockResolvedValue({ recoveryId: 'recovery-2', resendAfter: RESEND_AFTER });
  mockStartSignupResume.mockResolvedValue({ resumeId: 'resume-1', resendAfter: RESEND_AFTER });
});

describe('useSubmitReviewFlowStore.submit recovery', () => {
  it('finishes recovery and stores the bootstrap credential', async () => {
    await expect(flow().submit()).resolves.toBe('recovered');

    expect(mockFinishRecovery).toHaveBeenCalledWith({
      recoveryId: 'recovery-1',
      code: CODE,
      identity: IDENTITY,
      governmentId: GOVERNMENT_ID,
    });
    expect(sessionStore().session).toEqual({
      status: 'phoneVerified',
      source: 'recovery',
      phoneNationalNumber: '4155550100',
      bootstrapToken: token.bootstrapToken,
      bootstrapTokenExpiresAt: token.expiresAt,
      kycSubmission: 'notSubmitted',
      identity: IDENTITY,
      ssnLast4,
    });
    expect(track).toHaveBeenCalledWith('cash.phone_verified', { mode: 'recovery' });
    expect(flow().state).toBe('entry');
  });

  it('keeps the recovery inputs available after an identity mismatch', async () => {
    mockFinishRecovery.mockResolvedValue({ outcome: 'identityMismatch' });

    await expect(flow().submit()).resolves.toBe('failed');

    expect(flow().state).toBe('identityMismatch');
    expect(verifyFlow().code).toBe(CODE);
    expect(sessionStore().session).toMatchObject({ status: 'recovery', identity: IDENTITY, ssnLast4 });
  });

  it('returns to OTP entry without replacing the session when the code is invalid', async () => {
    mockFinishRecovery.mockResolvedValue({ outcome: 'codeInvalid' });

    await expect(flow().submit()).resolves.toBe('phoneCodeRequired');

    expect(verifyFlow()).toMatchObject({ code: '', state: 'error' });
    expect(sessionStore().session).toMatchObject({ status: 'recovery', challenge: CHALLENGE });
    expect(mockStartRecovery).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('cash.phone_verify_failed', { mode: 'recovery', reason: 'client_error' });
  });

  it('starts a fresh recovery session after the old session expires and preserves the identity draft', async () => {
    mockFinishRecovery.mockResolvedValue({ outcome: 'sessionInvalid' });

    await expect(flow().submit()).resolves.toBe('phoneCodeRequired');

    expect(mockStartRecovery).toHaveBeenCalledWith({ nationalNumber: '4155550100' });
    expect(sessionStore().session).toEqual({
      status: 'recovery',
      challenge: { kind: 'recovery', recoveryId: 'recovery-2' },
      phoneNationalNumber: '4155550100',
      resendAfter: RESEND_AFTER,
      identity: IDENTITY,
      ssnLast4,
    });
    expect(verifyFlow()).toMatchObject({ code: '', state: 'entry' });
  });

  it('switches to signup resume when the account has no passkey', async () => {
    mockFinishRecovery.mockResolvedValue({ outcome: 'signupIncomplete' });

    await expect(flow().submit()).resolves.toBe('phoneCodeRequired');

    expect(mockStartSignupResume).toHaveBeenCalledWith({ nationalNumber: '4155550100' });
    expect(sessionStore().session).toEqual({
      status: 'phoneSubmitted',
      challenge: { kind: 'resume', resumeId: 'resume-1' },
      phoneNationalNumber: '4155550100',
      resendAfter: RESEND_AFTER,
    });
    expect(track).toHaveBeenCalledWith('cash.phone_submitted', { mode: 'resume' });
    expect(verifyFlow()).toMatchObject({ code: '', state: 'entry' });
  });

  it('locks further submissions when recovery access is blocked', async () => {
    mockFinishRecovery.mockResolvedValue({ outcome: 'accessBlocked' });

    await expect(flow().submit()).resolves.toBe('failed');
    await expect(flow().submit()).resolves.toBe('skipped');

    expect(flow().state).toBe('locked');
    expect(mockFinishRecovery).toHaveBeenCalledTimes(1);
  });

  it('keeps an unexpected request failure retryable without changing the recovery session', async () => {
    mockFinishRecovery.mockRejectedValueOnce(new Error('network down'));

    await expect(flow().submit()).resolves.toBe('failed');

    expect(flow().state).toBe('error');
    expect(sessionStore().session).toMatchObject({ status: 'recovery', challenge: CHALLENGE });
    expect(logger.error).toHaveBeenCalled();

    await expect(flow().submit()).resolves.toBe('recovered');
  });

  it('does not apply a recovery result after the setup session changes', async () => {
    mockFinishRecovery.mockImplementation(async () => {
      sessionStore().setPhoneSubmitted({
        challenge: { kind: 'signup', userId: 'user-2' },
        phoneNationalNumber: '4155550101',
        resendAfter: 0,
      });
      return { outcome: 'recovered', ...token };
    });

    await expect(flow().submit()).resolves.toBe('cancelled');

    expect(sessionStore().session).toMatchObject({ status: 'phoneSubmitted', phoneNationalNumber: '4155550101' });
    expect(track).not.toHaveBeenCalledWith('cash.phone_verified', expect.anything());
  });
});
