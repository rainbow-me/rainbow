import { analytics } from '@/analytics';
import { logger } from '@/logger';
import { delay } from '@/utils/delay';

import {
  finishSignupResume,
  getUserStatus,
  KycStatus,
  resendPhoneCode,
  startRecovery,
  startSignupResume,
  verifyPhone,
} from '../services/userClient';
import { useCashSetupSessionStore, type PhoneVerificationChallenge } from './cashSetupSessionStore';
import { useVerifyPhoneFlowStore } from './verifyPhoneFlowStore';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: {
      cashPhoneVerified: 'cash.phone_verified',
      cashPhoneVerifyFailed: 'cash.phone_verify_failed',
      cashPhoneResendFailed: 'cash.phone_resend_failed',
      cashPhoneSubmitted: 'cash.phone_submitted',
      cashKycApproved: 'cash.kyc_approved',
      cashKycAwaitingDecision: 'cash.kyc_awaiting_decision',
      cashKycFailed: 'cash.kyc_failed',
    },
  },
}));

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('@/utils/delay', () => ({
  delay: jest.fn(() => Promise.resolve()),
}));

jest.mock('../services/userClient', () => ({
  KycStatus: {
    Unspecified: 'KYC_STATUS_UNSPECIFIED',
    Pending: 'KYC_STATUS_PENDING',
    Approved: 'KYC_STATUS_APPROVED',
    Rejected: 'KYC_STATUS_REJECTED',
    Review: 'KYC_STATUS_REVIEW',
  },
  finishSignupResume: jest.fn(),
  getUserStatus: jest.fn(),
  resendPhoneCode: jest.fn(),
  startRecovery: jest.fn(),
  startSignupResume: jest.fn(),
  verifyPhone: jest.fn(),
}));

const mockVerifyPhone = jest.mocked(verifyPhone);
const mockFinishSignupResume = jest.mocked(finishSignupResume);
const mockGetUserStatus = jest.mocked(getUserStatus);
const mockDelay = jest.mocked(delay);
const mockResendPhoneCode = jest.mocked(resendPhoneCode);
const mockStartRecovery = jest.mocked(startRecovery);
const mockStartSignupResume = jest.mocked(startSignupResume);
const track = jest.mocked(analytics.track);

const CODE = '123456';
const TOKEN = { bootstrapToken: 'bst_1', expiresAt: 1_750_000_000_000 };
const RESEND_AFTER = 1_750_000_030_000;

const flow = () => useVerifyPhoneFlowStore.getState();
const store = () => useCashSetupSessionStore.getState();
const session = () => store().session;
const challenge = () => {
  const current = session();
  if (current.status !== 'phoneSubmitted') throw new Error('expected a phoneSubmitted session');
  return current.challenge;
};
const submitPhone = (challenge: PhoneVerificationChallenge, phoneNationalNumber = '4155550100') =>
  store().setPhoneSubmitted({ challenge, phoneNationalNumber, resendAfter: 0 });
const startAccountRecovery = (recoveryId = 'recovery-1') =>
  store().setPhoneSubmitted({ challenge: { kind: 'recovery', recoveryId }, phoneNationalNumber: '4155550100', resendAfter: 0 });

beforeEach(() => {
  jest.clearAllMocks();
  store().reset();
  submitPhone({ kind: 'signup', userId: 'user-1' });
  useVerifyPhoneFlowStore.getState().reset();
  mockVerifyPhone.mockResolvedValue(TOKEN);
  mockFinishSignupResume.mockResolvedValue({ outcome: 'verified', ...TOKEN });
  mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Unspecified });
  mockResendPhoneCode.mockResolvedValue({ resendAfter: RESEND_AFTER });
  mockStartRecovery.mockResolvedValue({ recoveryId: 'recovery-2', resendAfter: RESEND_AFTER });
  mockStartSignupResume.mockResolvedValue({ resumeId: 'rcv_2', resendAfter: RESEND_AFTER });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useVerifyPhoneFlowStore.submit', () => {
  it('verifies the code, stores the token, tracks, and keeps the OTP input disabled', async () => {
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('verified');

    expect(mockVerifyPhone).toHaveBeenCalledWith({ userId: 'user-1', code: CODE });
    expect(session()).toMatchObject({
      status: 'phoneVerified',
      bootstrapToken: TOKEN.bootstrapToken,
      bootstrapTokenExpiresAt: TOKEN.expiresAt,
    });
    expect(track).toHaveBeenCalledWith('cash.phone_verified', { mode: 'signup' });
    expect(flow().state).toBe('submitted');
  });

  it('verifies a resume challenge through FinishSignupResume', async () => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('verified');

    expect(mockFinishSignupResume).toHaveBeenCalledWith({ resumeId: 'rcv_1', code: CODE });
    expect(mockVerifyPhone).not.toHaveBeenCalled();
    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: TOKEN.bootstrapToken });
    expect(track).toHaveBeenCalledWith('cash.phone_verified', { mode: 'resume' });
  });

  it.each([
    { kycStatus: KycStatus.Approved, expected: 'approved' },
    { kycStatus: KycStatus.Pending, expected: 'reviewing' },
    { kycStatus: KycStatus.Review, expected: 'reviewing' },
    { kycStatus: KycStatus.Rejected, expected: 'rejected' },
  ])('surfaces $expected for a resumed account whose KYC is $kycStatus', async ({ kycStatus, expected }) => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });
    mockGetUserStatus.mockResolvedValue({ kycStatus });
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('verifiedKycOutcome');

    expect(mockGetUserStatus).toHaveBeenCalledWith({ bootstrapToken: TOKEN.bootstrapToken });
    expect(flow().kycOutcome).toBe(expected);
    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: TOKEN.bootstrapToken });
    expect(track).toHaveBeenCalledWith('cash.phone_verified', { mode: 'resume' });
    expect(flow().state).toBe('submitted');
  });

  it.each([
    { kycStatus: KycStatus.Approved, event: 'cash.kyc_approved', payload: undefined },
    { kycStatus: KycStatus.Pending, event: 'cash.kyc_awaiting_decision', payload: { source: 'resume' } },
    { kycStatus: KycStatus.Rejected, event: 'cash.kyc_failed', payload: { reason: 'rejected' } },
  ])('tracks $event when a resumed account reports $kycStatus', async ({ event, kycStatus, payload }) => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });
    mockGetUserStatus.mockResolvedValue({ kycStatus });
    flow().setCode(CODE);

    await flow().submit();

    expect(track).toHaveBeenCalledWith(event, ...(payload ? [payload] : []));
  });

  it('sends a resumed account that never submitted KYC through the KYC steps', async () => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });
    mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Unspecified });
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('verified');

    expect(flow().kycOutcome).toBeNull();
  });

  it('retries a failed resume status check once after a delay', async () => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });
    mockGetUserStatus.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce({ kycStatus: KycStatus.Approved });
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('verifiedKycOutcome');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(2);
    expect(mockDelay).toHaveBeenCalledWith(2000);
    expect(flow().kycOutcome).toBe('approved');
    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: TOKEN.bootstrapToken });
  });

  it('keeps the verification and falls back to the KYC entry flow when the resume status check keeps failing', async () => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });
    mockGetUserStatus.mockRejectedValue(new Error('network down'));
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('verified');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(2);
    expect(flow().kycOutcome).toBeNull();
    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: TOKEN.bootstrapToken });
    expect(track).toHaveBeenCalledWith('cash.phone_verified', { mode: 'resume' });
    expect(track).not.toHaveBeenCalledWith('cash.phone_verify_failed', expect.anything());
  });

  it('does not check KYC status for a fresh signup', async () => {
    mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Approved });
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('verified');

    expect(mockGetUserStatus).not.toHaveBeenCalled();
  });

  it('switches to account recovery when the resumed account turns out to have a passkey', async () => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });
    mockFinishSignupResume.mockResolvedValue({ outcome: 'signupAlreadyComplete' });
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('recoveryStarted');

    expect(mockStartRecovery).toHaveBeenCalledWith({ nationalNumber: '4155550100' });
    expect(session()).toEqual({
      status: 'recovery',
      challenge: { kind: 'recovery', recoveryId: 'recovery-2' },
      phoneNationalNumber: '4155550100',
      resendAfter: RESEND_AFTER,
      identity: { firstName: '', lastName: '', dateOfBirth: null },
      ssnLast4: '',
    });
    expect(track).toHaveBeenCalledWith('cash.phone_submitted', { mode: 'recovery' });
    expect(track).not.toHaveBeenCalledWith('cash.phone_verified', expect.anything());
    expect(flow().state).toBe('entry');
    expect(flow().code).toBe('');
  });

  it('retains a recovery OTP for the personal-details submission', async () => {
    startAccountRecovery();
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('recoveryCodeAccepted');

    expect(mockVerifyPhone).not.toHaveBeenCalled();
    expect(mockFinishSignupResume).not.toHaveBeenCalled();
    expect(flow().state).toBe('submitted');
    expect(flow().code).toBe(CODE);
    expect(session()).toMatchObject({ status: 'recovery', challenge: { recoveryId: 'recovery-1' } });
  });

  it('clears the code, stores no token, and reports the failure when verification throws', async () => {
    mockVerifyPhone.mockRejectedValue(new Error('wrong code'));
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe('failed');

    expect(flow().state).toBe('error');
    expect(flow().code).toBe('');
    expect(session().status).toBe('phoneSubmitted');
    expect(track).toHaveBeenCalledWith('cash.phone_verify_failed', { reason: 'unknown', mode: 'signup' });
    expect(track).not.toHaveBeenCalledWith('cash.phone_verified', expect.anything());
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns to entry when the code is edited after an error', async () => {
    mockVerifyPhone.mockRejectedValue(new Error('wrong code'));
    flow().setCode(CODE);
    await flow().submit();
    expect(flow().state).toBe('error');

    flow().setCode('1');

    expect(flow().state).toBe('entry');
    expect(flow().code).toBe('1');
  });

  it('ignores an incomplete code', async () => {
    flow().setCode('12345');

    await expect(flow().submit()).resolves.toBe('failed');

    expect(mockVerifyPhone).not.toHaveBeenCalled();
    expect(flow().state).toBe('entry');
  });

  it('ignores a submit while a resend is pending', async () => {
    let resolveResend!: (value: { resendAfter: number }) => void;
    mockResendPhoneCode.mockReturnValue(
      new Promise(resolve => {
        resolveResend = resolve;
      })
    );

    const resend = flow().resend();
    flow().setCode(CODE);

    const result = await flow().submit();
    resolveResend({ resendAfter: RESEND_AFTER });
    await resend;

    expect(result).toBe('failed');
    expect(mockVerifyPhone).not.toHaveBeenCalled();
    expect(flow().state).toBe('entry');
  });

  it('discards a verification that resolves after the session was replaced', async () => {
    let resolveVerify!: (value: typeof TOKEN) => void;
    mockVerifyPhone.mockReturnValue(
      new Promise(resolve => {
        resolveVerify = resolve;
      })
    );
    flow().setCode(CODE);

    const pending = flow().submit();
    submitPhone({ kind: 'signup', userId: 'user-2' }, '4155550101');
    resolveVerify(TOKEN);

    await expect(pending).resolves.toBe('failed');
    expect(session()).toMatchObject({ status: 'phoneSubmitted', challenge: { kind: 'signup', userId: 'user-2' } });
    expect(track).not.toHaveBeenCalledWith('cash.phone_verified', expect.anything());
    expect(flow().state).toBe('entry');
    expect(flow().code).toBe('');
  });

  it('discards a verification that resolves after a replacement submission for the same user', async () => {
    let resolveVerify!: (value: typeof TOKEN) => void;
    mockVerifyPhone.mockReturnValue(
      new Promise(resolve => {
        resolveVerify = resolve;
      })
    );
    flow().setCode(CODE);

    const pending = flow().submit();
    submitPhone({ kind: 'signup', userId: 'user-1' });
    resolveVerify(TOKEN);

    await expect(pending).resolves.toBe('failed');
    expect(session().status).toBe('phoneSubmitted');
    expect(track).not.toHaveBeenCalledWith('cash.phone_verified', expect.anything());
  });

  it('leaves the replacement flow untouched when an old verification rejects', async () => {
    let rejectVerify!: (error: Error) => void;
    mockVerifyPhone.mockReturnValue(
      new Promise((_, reject) => {
        rejectVerify = reject;
      })
    );
    flow().setCode(CODE);

    const pending = flow().submit();
    submitPhone({ kind: 'signup', userId: 'user-2' }, '4155550101');
    flow().reset();
    flow().setCode('654321');
    rejectVerify(new Error('expired code'));

    await expect(pending).resolves.toBe('failed');
    expect(flow().state).toBe('entry');
    expect(flow().code).toBe('654321');
    expect(track).not.toHaveBeenCalledWith('cash.phone_verify_failed', expect.anything());
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('completes a verification when only the resend cooldown changed meanwhile', async () => {
    let resolveVerify!: (value: typeof TOKEN) => void;
    mockVerifyPhone.mockReturnValue(
      new Promise(resolve => {
        resolveVerify = resolve;
      })
    );
    flow().setCode(CODE);

    const pending = flow().submit();
    store().setResendAfter(challenge(), RESEND_AFTER);
    resolveVerify(TOKEN);

    await expect(pending).resolves.toBe('verified');
    expect(session()).toMatchObject({ status: 'phoneVerified' });
  });

  it('ignores a second submit while verifying', async () => {
    let resolveVerify!: (value: typeof TOKEN) => void;
    mockVerifyPhone.mockReturnValue(
      new Promise(resolve => {
        resolveVerify = resolve;
      })
    );
    flow().setCode(CODE);

    const first = flow().submit();
    await expect(flow().submit()).resolves.toBe('failed');

    expect(mockVerifyPhone).toHaveBeenCalledTimes(1);
    resolveVerify(TOKEN);
    await expect(first).resolves.toBe('verified');
  });

  // The Confirm button is briefly tappable again between acceptance and the pager moving on.
  it('ignores a submit after the code was already accepted', async () => {
    flow().setCode(CODE);
    await flow().submit();

    await expect(flow().submit()).resolves.toBe('failed');

    expect(mockVerifyPhone).toHaveBeenCalledTimes(1);
    expect(flow().state).toBe('submitted');
  });
});

describe('useVerifyPhoneFlowStore.resend', () => {
  it('resends only after the backend resendAfter time, then stores the next backend resendAfter', async () => {
    const now = 1_750_000_000_000;
    const dateNow = jest.spyOn(Date, 'now').mockReturnValue(now);
    store().setResendAfter(challenge(), now + 1);

    await flow().resend();
    expect(mockResendPhoneCode).not.toHaveBeenCalled();

    dateNow.mockReturnValue(now + 1);
    await flow().resend();
    expect(mockResendPhoneCode).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(session()).toMatchObject({ status: 'phoneSubmitted', resendAfter: RESEND_AFTER });
  });

  it('re-arms a resume challenge with a fresh StartSignupResume, replacing the resumeId', async () => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });

    await flow().resend();

    expect(mockStartSignupResume).toHaveBeenCalledWith({ nationalNumber: '4155550100' });
    expect(mockResendPhoneCode).not.toHaveBeenCalled();
    expect(session()).toEqual({
      status: 'phoneSubmitted',
      challenge: { kind: 'resume', resumeId: 'rcv_2' },
      phoneNationalNumber: '4155550100',
      resendAfter: RESEND_AFTER,
    });
    expect(flow().resending).toBeNull();
  });

  it('re-arms recovery with a fresh challenge while preserving the identity draft', async () => {
    startAccountRecovery();
    store().setFirstName('Ada');
    store().setLastName('Lovelace');
    store().setDateOfBirth({ year: 1815, month: 12, day: 10 });

    await flow().resend();

    expect(mockStartRecovery).toHaveBeenCalledWith({ nationalNumber: '4155550100' });
    expect(session()).toMatchObject({
      status: 'recovery',
      challenge: { kind: 'recovery', recoveryId: 'recovery-2' },
      resendAfter: RESEND_AFTER,
      identity: { firstName: 'Ada', lastName: 'Lovelace' },
    });
    expect(flow().resending).toBeNull();
  });

  it('reports the failure and clears the in-flight flag when the resend throws', async () => {
    mockResendPhoneCode.mockRejectedValue(new Error('resend failed'));

    await flow().resend();

    expect(track).toHaveBeenCalledWith('cash.phone_resend_failed', { reason: 'unknown', mode: 'signup' });
    expect(logger.error).toHaveBeenCalled();
    expect(flow().resending).toBeNull();
  });

  it('discards a resume re-arm that resolves after the session was replaced', async () => {
    submitPhone({ kind: 'resume', resumeId: 'rcv_1' });
    let resolveStart!: (value: { resumeId: string; resendAfter: number }) => void;
    mockStartSignupResume.mockReturnValue(
      new Promise(resolve => {
        resolveStart = resolve;
      })
    );

    const pending = flow().resend();
    submitPhone({ kind: 'signup', userId: 'user-2' }, '4155550101');
    resolveStart({ resumeId: 'rcv_2', resendAfter: RESEND_AFTER });

    await pending;
    expect(session()).toMatchObject({ status: 'phoneSubmitted', challenge: { kind: 'signup', userId: 'user-2' }, resendAfter: 0 });
    expect(flow().resending).toBeNull();
  });

  it('discards a resend that resolves after the session was replaced', async () => {
    let resolveResend!: (value: { resendAfter: number }) => void;
    mockResendPhoneCode.mockReturnValue(
      new Promise(resolve => {
        resolveResend = resolve;
      })
    );

    const pending = flow().resend();
    submitPhone({ kind: 'signup', userId: 'user-2' }, '4155550101');
    resolveResend({ resendAfter: RESEND_AFTER });

    await pending;
    expect(session()).toMatchObject({ status: 'phoneSubmitted', challenge: { kind: 'signup', userId: 'user-2' }, resendAfter: 0 });
    expect(flow().resending).toBeNull();
  });

  it("does not clear a newer resend when an old resend's cleanup runs", async () => {
    let resolveFirst!: (value: { resendAfter: number }) => void;
    let resolveSecond!: (value: { resendAfter: number }) => void;
    mockResendPhoneCode
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveFirst = resolve;
        })
      )
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveSecond = resolve;
        })
      );

    const first = flow().resend();
    submitPhone({ kind: 'signup', userId: 'user-1' });
    flow().reset();
    const second = flow().resend();
    expect(mockResendPhoneCode).toHaveBeenCalledTimes(2);

    resolveFirst({ resendAfter: RESEND_AFTER + 1 });
    await first;
    expect(flow().resending).not.toBeNull();
    expect(session()).toMatchObject({ status: 'phoneSubmitted', resendAfter: 0 });

    resolveSecond({ resendAfter: RESEND_AFTER });
    await second;
    expect(flow().resending).toBeNull();
    expect(session()).toMatchObject({ status: 'phoneSubmitted', resendAfter: RESEND_AFTER });
  });

  it('ignores a second resend while one is pending', async () => {
    let resolveResend!: (value: { resendAfter: number }) => void;
    mockResendPhoneCode.mockReturnValue(
      new Promise(resolve => {
        resolveResend = resolve;
      })
    );

    const first = flow().resend();
    await flow().resend();
    expect(mockResendPhoneCode).toHaveBeenCalledTimes(1);

    resolveResend({ resendAfter: RESEND_AFTER });
    await first;
    expect(flow().resending).toBeNull();
  });
});
