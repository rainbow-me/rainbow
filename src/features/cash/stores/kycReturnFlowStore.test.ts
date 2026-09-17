import { analytics } from '@/analytics';
import { logger } from '@/logger';

import { getUserStatus, KycRejectionReason, KycStatus } from '../services/userClient';
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
  delay: () => Promise.resolve(),
}));

jest.mock('../services/userClient', () => ({
  ...jest.requireActual('../services/userClient'),
  getUserStatus: jest.fn(),
}));

const mockGetUserStatus = jest.mocked(getUserStatus);
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

afterEach(() => {
  useCashSetupSessionStore.getState().reset();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe('useKycReturnFlowStore.check', () => {
  it.each([
    { kycStatus: KycStatus.Approved, kycRejectionReason: undefined, expected: 'approved' },
    { kycStatus: KycStatus.Pending, kycRejectionReason: undefined, expected: 'reviewing' },
    { kycStatus: KycStatus.Review, kycRejectionReason: undefined, expected: 'reviewing' },
    { kycStatus: KycStatus.Rejected, kycRejectionReason: undefined, expected: 'rejected' },
    {
      kycStatus: KycStatus.Rejected,
      kycRejectionReason: KycRejectionReason.StateNotSupported,
      expected: 'unsupportedState',
    },
  ])('surfaces $expected when the retained token reports $kycStatus', async ({ kycStatus, kycRejectionReason, expected }) => {
    verifyPhone();
    mockGetUserStatus.mockResolvedValue({ kycStatus, kycRejectionReason });

    await expect(flow().check()).resolves.toBe('outcome');

    expect(mockGetUserStatus).toHaveBeenCalledWith({ bootstrapToken: BOOTSTRAP_TOKEN });
    expect(flow().state).toBe(expected);
    expect(session()).toMatchObject({
      status: 'phoneVerified',
      bootstrapToken: BOOTSTRAP_TOKEN,
      kycSubmission: 'submitted',
    });
  });

  it('leaves a never-submitted user on the KYC steps with the token intact', async () => {
    verifyPhone();

    await expect(flow().check()).resolves.toBe('notSubmitted');

    expect(flow().state).toBe('idle');
    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: BOOTSTRAP_TOKEN });
    expect(track).not.toHaveBeenCalled();
  });

  it('treats an unrecognized provider status as no submitted KYC outcome', async () => {
    verifyPhone();
    mockGetUserStatus.mockResolvedValue({ kycStatus: 'KYC_STATUS_FUTURE' as KycStatus });

    await expect(flow().check()).resolves.toBe('notSubmitted');

    expect(flow().state).toBe('idle');
    expect(session()).toMatchObject({ status: 'phoneVerified', kycSubmission: 'notSubmitted' });
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

  it('does not publish a status response that lands after the credential expires', async () => {
    jest.useFakeTimers();
    const now = Date.now();
    const status = Promise.withResolvers<{ kycStatus: KycStatus }>();
    verifyPhone(now + 1_000);
    mockGetUserStatus.mockReturnValue(status.promise);

    const pending = flow().check();
    jest.advanceTimersByTime(1_000);
    expect(session()).toEqual({ status: 'empty' });
    status.resolve({ kycStatus: KycStatus.Approved });

    await expect(pending).resolves.toBe('expired');
    expect(flow().state).toBe('idle');
    expect(track).not.toHaveBeenCalled();
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
