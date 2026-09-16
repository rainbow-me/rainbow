import { analytics } from '@/analytics';
import { logger } from '@/logger';
import { delay } from '@/utils/delay';

import { getUserStatus, KycStatus } from '../services/userClient';
import { useCashAccountStore } from './cashAccountStore';
import { useCashSetupSessionStore, type PhoneVerificationChallenge } from './cashSetupSessionStore';
import { useKycReturnFlowStore } from './kycReturnFlowStore';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: {
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
  getUserStatus: jest.fn(),
}));

const mockGetUserStatus = jest.mocked(getUserStatus);
const mockDelay = jest.mocked(delay);
const track = jest.mocked(analytics.track);

const CHALLENGE: PhoneVerificationChallenge = { kind: 'signup', userId: 'user-1' };
const BOOTSTRAP_TOKEN = 'bst_1';

const flow = () => useKycReturnFlowStore.getState();
const session = () => useCashSetupSessionStore.getState().session;

function verifyPhone(expiresAt = Date.now() + 60_000) {
  const store = useCashSetupSessionStore.getState();
  store.setPhoneSubmitted({ challenge: CHALLENGE, phoneNationalNumber: '4155550100', resendAfter: 0 });
  store.setPhoneVerified(CHALLENGE, { bootstrapToken: BOOTSTRAP_TOKEN, expiresAt });
}

beforeEach(() => {
  jest.clearAllMocks();
  useCashAccountStore.getState().clearUserId();
  useCashSetupSessionStore.getState().reset();
  flow().reset();
  mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Unspecified });
});

describe('useKycReturnFlowStore.check', () => {
  it.each([
    { kycStatus: KycStatus.Approved, expected: 'approved' },
    { kycStatus: KycStatus.Pending, expected: 'reviewing' },
    { kycStatus: KycStatus.Review, expected: 'reviewing' },
    { kycStatus: KycStatus.Rejected, expected: 'rejected' },
  ])('surfaces $expected when the retained token reports $kycStatus', async ({ kycStatus, expected }) => {
    verifyPhone();
    mockGetUserStatus.mockResolvedValue({ kycStatus });

    await expect(flow().check()).resolves.toBe('outcome');

    expect(mockGetUserStatus).toHaveBeenCalledWith({ bootstrapToken: BOOTSTRAP_TOKEN });
    expect(flow().state).toBe(expected);
    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: BOOTSTRAP_TOKEN });
  });

  it.each([
    { kycStatus: KycStatus.Approved, event: 'cash.kyc_approved', payload: undefined },
    { kycStatus: KycStatus.Pending, event: 'cash.kyc_awaiting_decision', payload: { source: 'return' } },
    { kycStatus: KycStatus.Rejected, event: 'cash.kyc_failed', payload: { reason: 'rejected' } },
  ])('tracks $event when the retained token reports $kycStatus', async ({ event, kycStatus, payload }) => {
    verifyPhone();
    mockGetUserStatus.mockResolvedValue({ kycStatus });

    await flow().check();

    expect(track).toHaveBeenCalledWith(event, ...(payload ? [payload] : []));
  });

  it('leaves a never-submitted user on the KYC steps with the token intact', async () => {
    verifyPhone();

    await expect(flow().check()).resolves.toBe('notSubmitted');

    expect(flow().state).toBe('idle');
    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: BOOTSTRAP_TOKEN });
    expect(track).not.toHaveBeenCalled();
  });

  it('keeps a submitted user awaiting a decision when the retained token reports no verdict', async () => {
    verifyPhone();
    useCashSetupSessionStore.getState().markKycSubmitted(BOOTSTRAP_TOKEN);

    await expect(flow().check()).resolves.toBe('outcome');

    expect(flow().state).toBe('reviewing');
    expect(session()).toMatchObject({
      status: 'phoneVerified',
      bootstrapToken: BOOTSTRAP_TOKEN,
      kycSubmission: 'submitted',
    });
    expect(track).toHaveBeenCalledWith('cash.kyc_awaiting_decision', { source: 'return' });
  });

  it('retries a failed status read once after a delay', async () => {
    verifyPhone();
    mockGetUserStatus.mockRejectedValueOnce(new Error('network down')).mockResolvedValueOnce({ kycStatus: KycStatus.Approved });

    await expect(flow().check()).resolves.toBe('outcome');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(2);
    expect(mockDelay).toHaveBeenCalledWith(2000);
    expect(flow().state).toBe('approved');
  });

  it('keeps a never-submitted session when the status read keeps failing', async () => {
    verifyPhone();
    mockGetUserStatus.mockRejectedValue(new Error('bootstrap token is invalid or expired'));

    await expect(flow().check()).resolves.toBe('notSubmitted');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(2);
    expect(session()).toMatchObject({
      status: 'phoneVerified',
      bootstrapToken: BOOTSTRAP_TOKEN,
      kycSubmission: 'notSubmitted',
    });
    expect(flow().state).toBe('idle');
    expect(logger.warn).toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('keeps a submitted session awaiting a decision when the status read keeps failing', async () => {
    verifyPhone();
    useCashSetupSessionStore.getState().markKycSubmitted(BOOTSTRAP_TOKEN);
    mockGetUserStatus.mockRejectedValue(new Error('network down'));

    await expect(flow().check()).resolves.toBe('outcome');

    expect(session()).toMatchObject({
      status: 'phoneVerified',
      bootstrapToken: BOOTSTRAP_TOKEN,
      kycSubmission: 'submitted',
    });
    expect(flow().state).toBe('reviewing');
    expect(logger.warn).toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('cash.kyc_awaiting_decision', { source: 'return' });
  });

  it('drops an expired session without reading its status', async () => {
    const now = Date.now();
    verifyPhone(now + 1_000);
    jest.spyOn(Date, 'now').mockReturnValue(now + 1_001);

    await expect(flow().check()).resolves.toBe('expired');

    expect(mockGetUserStatus).not.toHaveBeenCalled();
    expect(session()).toEqual({ status: 'empty' });
  });

  it('never enrols a second account on a device that already recorded one', async () => {
    verifyPhone();
    useCashAccountStore.getState().setUserId('user-2');

    await expect(flow().check()).resolves.toBe('skipped');

    expect(mockGetUserStatus).not.toHaveBeenCalled();
  });

  it('does nothing without a verified phone', async () => {
    useCashSetupSessionStore.getState().setPhoneSubmitted({ challenge: CHALLENGE, phoneNationalNumber: '4155550100', resendAfter: 0 });

    await expect(flow().check()).resolves.toBe('skipped');

    expect(mockGetUserStatus).not.toHaveBeenCalled();
    expect(session()).toMatchObject({ status: 'phoneSubmitted' });
  });

  it('ignores a result that lands after the setup screen reset the flow', async () => {
    verifyPhone();
    let resolveStatus: (value: { kycStatus: KycStatus }) => void = () => undefined;
    mockGetUserStatus.mockReturnValue(
      new Promise(resolve => {
        resolveStatus = resolve;
      })
    );

    const pending = flow().check();
    expect(flow().state).toBe('checking');
    flow().reset();
    resolveStatus({ kycStatus: KycStatus.Approved });

    await expect(pending).resolves.toBe('cancelled');
    expect(flow().state).toBe('idle');
    expect(track).not.toHaveBeenCalled();
  });

  it('keeps the retained session when a failing read lands after the setup screen reset the flow', async () => {
    verifyPhone();
    let rejectStatus: (error: Error) => void = () => undefined;
    mockGetUserStatus.mockReturnValue(
      new Promise((_, reject) => {
        rejectStatus = reject;
      })
    );

    const pending = flow().check();
    flow().reset();
    rejectStatus(new Error('network down'));

    await expect(pending).resolves.toBe('cancelled');
    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: BOOTSTRAP_TOKEN });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('runs one check at a time', async () => {
    verifyPhone();
    mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Pending });

    const [first, second] = await Promise.all([flow().check(), flow().check()]);

    expect(first).toBe('outcome');
    expect(second).toBe('skipped');
    expect(mockGetUserStatus).toHaveBeenCalledTimes(1);
  });
});
