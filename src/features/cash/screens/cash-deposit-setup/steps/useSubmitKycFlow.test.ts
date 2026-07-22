import { analytics } from '@/analytics';
import { logger } from '@/logger';
import { delay } from '@/utils/delay';

import { createUsSsnLast4GovernmentId, isValidUsSsnLast4 } from '../../../services/cashSetupIdentityService';
import { getUserStatus, KycStatus, submitOnboarding } from '../../../services/userClient';
import { useCashDepositSetupStore } from '../../../stores/cashDepositSetupStore';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { KYC_POLL_BUDGET_MS, KYC_POLL_INTERVAL_MS, useSubmitKycFlowStore } from './useSubmitKycFlow';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: { cashKycSubmitted: 'cash.kyc_submitted', cashKycApproved: 'cash.kyc_approved', cashKycFailed: 'cash.kyc_failed' },
  },
}));

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('@/helpers/alert', () => ({
  WrappedAlert: { alert: jest.fn() },
}));

jest.mock('@/utils/delay', () => ({
  delay: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../services/userClient', () => ({
  KycStatus: {
    Unspecified: 'KYC_STATUS_UNSPECIFIED',
    Pending: 'KYC_STATUS_PENDING',
    Approved: 'KYC_STATUS_APPROVED',
    Rejected: 'KYC_STATUS_REJECTED',
    Review: 'KYC_STATUS_REVIEW',
  },
  getUserStatus: jest.fn(),
  submitOnboarding: jest.fn(),
}));

jest.mock('../../../stores/cashDepositSetupStore', () => ({
  useCashDepositSetupStore: { getState: jest.fn() },
}));

jest.mock('../useCashDepositSetupNavigation', () => ({
  useCashDepositSetupNavigation: jest.fn(),
}));

const mockSubmitOnboarding = submitOnboarding as jest.Mock;
const mockGetUserStatus = getUserStatus as jest.Mock;
const mockDelay = delay as jest.Mock;
const track = analytics.track as jest.Mock;
const setFact = jest.fn();

const TOKEN = 'bst_1';
const IDENTITY = { firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: { year: 1990, month: 1, day: 2 } };
const SSN_LAST4 = '6789';
if (!isValidUsSsnLast4(SSN_LAST4)) throw new Error('expected a valid SSN last four');
const GOVERNMENT_ID = createUsSsnLast4GovernmentId(SSN_LAST4);
const POLL_ATTEMPTS = KYC_POLL_BUDGET_MS / KYC_POLL_INTERVAL_MS;

const flow = () => useSubmitKycFlowStore.getState();
const session = () => useCashSetupSessionStore.getState();
const challenge = () => {
  const current = session().session;
  if (current.status !== 'phoneSubmitted') throw new Error('expected a phoneSubmitted session');
  return current.challenge;
};

beforeEach(() => {
  jest.clearAllMocks();
  (useCashDepositSetupStore.getState as jest.Mock).mockReturnValue({ setFact });
  session().reset();
  session().setPhoneSubmitted({ userId: 'user-1', phoneNationalNumber: '4155550100', resendAfter: 0 });
  session().setPhoneVerified(challenge(), { bootstrapToken: TOKEN, expiresAt: Date.now() + 60_000 });
  session().setIdentity(IDENTITY);
  session().setGovernmentId(GOVERNMENT_ID);
  mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Approved });
  mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Approved });
});

describe('useSubmitKycFlowStore.submit', () => {
  it('submits, flips the fact, tracks, and resolves approved — in order', async () => {
    await expect(flow().submit()).resolves.toBe('approved');

    expect(mockSubmitOnboarding).toHaveBeenCalledWith({
      bootstrapToken: TOKEN,
      countryCode: 'US',
      identity: IDENTITY,
      governmentId: GOVERNMENT_ID,
    });
    expect(setFact).toHaveBeenCalledWith('kycPassed', true);
    expect(track).toHaveBeenNthCalledWith(1, 'cash.kyc_submitted');
    expect(track).toHaveBeenNthCalledWith(2, 'cash.kyc_approved');

    const [trackSubmittedOrder, trackApprovedOrder] = track.mock.invocationCallOrder;
    const [submitOrder] = mockSubmitOnboarding.mock.invocationCallOrder;
    const [setFactOrder] = setFact.mock.invocationCallOrder;
    expect(trackSubmittedOrder).toBeLessThan(submitOrder);
    expect(submitOrder).toBeLessThan(setFactOrder);
    expect(setFactOrder).toBeLessThan(trackApprovedOrder);

    expect(mockGetUserStatus).not.toHaveBeenCalled();
    expect(flow().state).toBe('entry');
  });

  it('polls while pending, then approves', async () => {
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Pending });
    mockGetUserStatus.mockResolvedValueOnce({ kycStatus: KycStatus.Pending }).mockResolvedValueOnce({ kycStatus: KycStatus.Approved });

    await expect(flow().submit()).resolves.toBe('approved');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(2);
    expect(mockGetUserStatus).toHaveBeenCalledWith({ bootstrapToken: TOKEN });
    expect(mockDelay).toHaveBeenCalledWith(KYC_POLL_INTERVAL_MS);
    expect(setFact).toHaveBeenCalledWith('kycPassed', true);
  });

  it('fails with timeout when pending never resolves within the poll budget', async () => {
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Pending });
    mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Pending });

    await expect(flow().submit()).resolves.toBe('failed');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(POLL_ATTEMPTS);
    expect(track).toHaveBeenCalledWith('cash.kyc_failed', { reason: 'timeout' });
    expect(setFact).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(flow().state).toBe('entry');
  });

  it.each([
    { kycStatus: 'KYC_STATUS_UNSPECIFIED', reason: 'unspecified' },
    { kycStatus: 'KYC_STATUS_REJECTED', reason: 'rejected' },
    { kycStatus: 'KYC_STATUS_REVIEW', reason: 'review' },
  ])('fails with $reason without polling', async ({ kycStatus, reason }) => {
    mockSubmitOnboarding.mockResolvedValue({ kycStatus });

    await expect(flow().submit()).resolves.toBe('failed');

    expect(mockGetUserStatus).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('cash.kyc_failed', { reason });
    expect(setFact).not.toHaveBeenCalled();
  });

  it('fails with the error message when the submission throws', async () => {
    mockSubmitOnboarding.mockRejectedValue(new Error('network down'));

    await expect(flow().submit()).resolves.toBe('failed');

    expect(track).toHaveBeenCalledWith('cash.kyc_failed', { reason: 'network down' });
    expect(setFact).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(flow().state).toBe('entry');
  });

  it('skips a second submit while one is in flight', async () => {
    let resolveSubmit!: (value: { kycStatus: KycStatus }) => void;
    mockSubmitOnboarding.mockReturnValue(
      new Promise(resolve => {
        resolveSubmit = resolve;
      })
    );

    const first = flow().submit();
    await expect(flow().submit()).resolves.toBe('skipped');

    expect(mockSubmitOnboarding).toHaveBeenCalledTimes(1);
    resolveSubmit({ kycStatus: KycStatus.Approved });
    await expect(first).resolves.toBe('approved');
  });

  it('skips when the session is missing identity or government id', async () => {
    session().reset();

    await expect(flow().submit()).resolves.toBe('skipped');

    expect(mockSubmitOnboarding).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });
});
