import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { analytics } from '@/analytics';
import { setRemoteConfig } from '@/features/config/testing/mockRemoteConfig';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { logger } from '@/logger';
import { delay } from '@/utils/delay';

import { CashAccessRefusedError } from '../../../services/cashAccessRefusal';
import { createUsSsnLast4GovernmentId, isValidUsSsnLast4 } from '../../../services/cashSetupIdentityService';
import { getUserStatus, KycRejectionReasonCode, KycStatus, submitOnboarding } from '../../../services/userClient';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { KYC_POLL_INTERVAL_MS, useSubmitReviewFlowStore, type SubmitReviewState } from './useSubmitReviewFlow';

vi.mock('@/analytics', () => ({
  analytics: {
    track: vi.fn(),
    event: {
      cashKycSubmitted: 'cash.kyc_submitted',
      cashKycApproved: 'cash.kyc_approved',
      cashKycAwaitingDecision: 'cash.kyc_awaiting_decision',
      cashKycFailed: 'cash.kyc_failed',
    },
  },
}));

const REVIEW_DELAY_MS = 60_000;

vi.mock('@/features/config/stores/remoteConfig');
setRemoteConfig({ cash_kyc_review_delay_ms: REVIEW_DELAY_MS });

vi.mock('@/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  RainbowError: class RainbowError extends Error {},
}));

vi.mock('@/utils/delay', () => ({
  delay: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../services/userClient', () => ({
  ...vi.requireActual('../../../services/userClient'),
  getUserStatus: vi.fn(),
  submitOnboarding: vi.fn(),
}));

const mockSubmitOnboarding = vi.mocked(submitOnboarding);
const mockGetUserStatus = vi.mocked(getUserStatus);
const mockDelay = vi.mocked(delay);
const track = vi.mocked(analytics.track);

const TOKEN = 'bst_1';
const IDENTITY = { firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: { year: 1990, month: 1, day: 2 } };
const SSN_LAST4 = '6789';
if (!isValidUsSsnLast4(SSN_LAST4)) throw new Error('expected a valid SSN last four');
const GOVERNMENT_ID = createUsSsnLast4GovernmentId(SSN_LAST4);

function fakeClock(start = 1_750_000_000_000) {
  let clock = start;
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  return { advance: (ms: number) => (clock += ms) };
}

const flow = () => useSubmitReviewFlowStore.getState();
const session = () => useCashSetupSessionStore.getState();
const challenge = () => {
  const current = session().session;
  if (current.status !== 'phoneSubmitted') throw new Error('expected a phoneSubmitted session');
  return current.challenge;
};

beforeEach(() => {
  vi.clearAllMocks();
  flow().reset();
  session().reset();
  session().setPhoneSubmitted({ challenge: { kind: 'signup', userId: 'user-1' }, phoneNationalNumber: '4155550100', resendAfter: 0 });
  session().setPhoneVerified(challenge(), { bootstrapToken: TOKEN, expiresAt: Date.now() + 60_000 });
  session().setFirstName(IDENTITY.firstName);
  session().setLastName(IDENTITY.lastName);
  session().setDateOfBirth(IDENTITY.dateOfBirth);
  session().setSsnLast4(GOVERNMENT_ID.value);
  mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Approved });
  mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Approved });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSubmitReviewFlowStore.submit onboarding', () => {
  it('submits, tracks, and resolves approved — in order', async () => {
    await expect(flow().submit()).resolves.toBe('approved');

    expect(mockSubmitOnboarding).toHaveBeenCalledWith({
      bootstrapToken: TOKEN,
      countryCode: 'US',
      identity: IDENTITY,
      governmentId: GOVERNMENT_ID,
    });
    expect(track).toHaveBeenNthCalledWith(1, 'cash.kyc_submitted');
    expect(track).toHaveBeenNthCalledWith(2, 'cash.kyc_approved');

    const [trackSubmittedOrder, trackApprovedOrder] = track.mock.invocationCallOrder;
    const [submitOrder] = mockSubmitOnboarding.mock.invocationCallOrder;
    expect(trackSubmittedOrder).toBeLessThan(submitOrder);
    expect(submitOrder).toBeLessThan(trackApprovedOrder);

    expect(mockGetUserStatus).not.toHaveBeenCalled();
    expect(flow().state).toBe('approved');
    expect(session().session).toMatchObject({ status: 'phoneVerified', kycSubmission: 'submitted' });
  });

  it('does not resubmit a previously submitted KYC application', async () => {
    session().markKycSubmitted(TOKEN);

    await expect(flow().submit()).resolves.toBe('skipped');

    expect(mockSubmitOnboarding).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('polls while pending, then approves', async () => {
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Pending });
    mockGetUserStatus.mockResolvedValueOnce({ kycStatus: KycStatus.Pending }).mockResolvedValueOnce({ kycStatus: KycStatus.Approved });

    await expect(flow().submit()).resolves.toBe('approved');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(2);
    expect(mockGetUserStatus).toHaveBeenCalledWith({ bootstrapToken: TOKEN });
    expect(mockDelay).toHaveBeenCalledWith(KYC_POLL_INTERVAL_MS);
  });

  it('switches to reviewing once the delay elapses, and keeps polling until the verdict lands', async () => {
    const clock = fakeClock();
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Pending });
    const statesWhilePolling: SubmitReviewState[] = [];
    mockGetUserStatus
      .mockImplementationOnce(() => {
        statesWhilePolling.push(flow().state);
        clock.advance(REVIEW_DELAY_MS);
        return Promise.resolve({ kycStatus: KycStatus.Pending });
      })
      .mockImplementationOnce(() => {
        statesWhilePolling.push(flow().state);
        return Promise.resolve({ kycStatus: KycStatus.Approved });
      });

    await expect(flow().submit()).resolves.toBe('approved');

    expect(statesWhilePolling).toEqual(['submitting', 'reviewing']);
    expect(track).toHaveBeenCalledWith('cash.kyc_awaiting_decision', { source: 'submit' });
    expect(track).not.toHaveBeenCalledWith('cash.kyc_failed', expect.anything());
    expect(flow().state).toBe('approved');
  });

  it('tracks the awaiting-decision event only once however long the wait runs', async () => {
    const clock = fakeClock();
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Pending });
    mockDelay.mockImplementationOnce(() => {
      clock.advance(REVIEW_DELAY_MS);
      return Promise.resolve();
    });
    mockGetUserStatus
      .mockResolvedValueOnce({ kycStatus: KycStatus.Pending })
      .mockResolvedValueOnce({ kycStatus: KycStatus.Pending })
      .mockResolvedValueOnce({ kycStatus: KycStatus.Approved });

    await flow().submit();

    expect(track.mock.calls.filter(([name]) => name === 'cash.kyc_awaiting_decision')).toHaveLength(1);
  });

  it('reports a rejection without offering a retry', async () => {
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Rejected });

    await expect(flow().submit()).resolves.toBe('rejected');

    expect(mockGetUserStatus).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith('cash.kyc_failed', { reason: 'rejected' });
    expect(flow().state).toBe('rejected');
  });

  describe.each(['submit', 'poll', 'retry'] as const)('unsupported location from %s', source => {
    it.each([
      { countryCode: 'US', regionCode: 'NY', regionName: 'New York' },
      { countryCode: 'US', regionCode: 'CA', regionName: 'California' },
      undefined,
    ])('retains %j for the sheet and clears it on reset', async unsupportedLocation => {
      const result = {
        kycStatus: KycStatus.Rejected,
        kycRejectionReason: { code: KycRejectionReasonCode.StateNotSupported, unsupportedLocation },
      };
      mockSubmitOnboarding.mockResolvedValue(source === 'submit' ? result : { kycStatus: KycStatus.Pending });
      mockGetUserStatus.mockResolvedValue(result);
      if (source === 'retry') useSubmitReviewFlowStore.setState({ kycSubmitted: true });

      await expect(flow().submit()).resolves.toBe('unsupportedState');

      expect(flow().kycRejectionReason).toEqual({ code: KycRejectionReasonCode.StateNotSupported, unsupportedLocation });
      expect(track).toHaveBeenCalledWith('cash.kyc_failed', { reason: 'state_not_supported' });
      expect(flow().state).toBe('unsupportedState');
      expect(mockGetUserStatus).toHaveBeenCalledTimes(source === 'submit' ? 0 : 1);
      expect(mockSubmitOnboarding).toHaveBeenCalledTimes(source === 'retry' ? 0 : 1);
      flow().reset();
      expect(flow().kycRejectionReason).toBeUndefined();
    });
  });

  it.each([KycStatus.Unspecified, KycStatus.Review])('keeps polling on %s instead of failing', async kycStatus => {
    mockSubmitOnboarding.mockResolvedValue({ kycStatus });
    mockGetUserStatus.mockResolvedValue({ kycStatus: KycStatus.Approved });

    await expect(flow().submit()).resolves.toBe('approved');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(1);
    expect(track).not.toHaveBeenCalledWith('cash.kyc_failed', expect.anything());
  });

  it('falls back to reviewing when a status poll fails, never to the retryable error', async () => {
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Pending });
    mockGetUserStatus.mockRejectedValue(new Error('token expired'));

    await expect(flow().submit()).resolves.toBe('awaitingDecision');

    expect(flow().state).toBe('reviewing');
    expect(track).toHaveBeenCalledWith('cash.kyc_awaiting_decision', { source: 'submit' });
    expect(track).not.toHaveBeenCalledWith('cash.kyc_failed', expect.anything());
    expect(logger.warn).toHaveBeenCalled();
  });

  it('manually retries only the status read after a network policy response during polling', async () => {
    const policyError = new CashAccessRefusedError('networkPolicy', new RainbowFetchError({ message: 'network policy' }));
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Pending });
    mockGetUserStatus.mockRejectedValueOnce(policyError).mockResolvedValueOnce({ kycStatus: KycStatus.Approved });

    await expect(flow().submit()).resolves.toBe('failed');

    expect(flow().state).toBe('entry');
    expect(logger.warn).not.toHaveBeenCalled();

    await expect(flow().submit()).resolves.toBe('approved');

    expect(mockSubmitOnboarding).toHaveBeenCalledTimes(1);
    expect(mockGetUserStatus).toHaveBeenCalledTimes(2);
    expect(track.mock.calls.filter(([event]) => event === 'cash.kyc_submitted')).toHaveLength(1);
  });

  it('ignores an active status poll after the flow is reset', async () => {
    const poll = Promise.withResolvers<Awaited<ReturnType<typeof getUserStatus>>>();
    const pollStarted = Promise.withResolvers<void>();
    mockSubmitOnboarding.mockResolvedValue({ kycStatus: KycStatus.Pending });
    mockGetUserStatus.mockImplementationOnce(() => {
      pollStarted.resolve();
      return poll.promise;
    });

    const submission = flow().submit();
    await pollStarted.promise;
    flow().reset();
    poll.resolve({
      kycStatus: KycStatus.Rejected,
      kycRejectionReason: {
        code: KycRejectionReasonCode.StateNotSupported,
        unsupportedLocation: { regionCode: 'CA', regionName: 'California' },
      },
    });

    await expect(submission).resolves.toBe('cancelled');

    expect(mockGetUserStatus).toHaveBeenCalledTimes(1);
    expect(flow().state).toBe('entry');
    expect(flow().kycRejectionReason).toBeUndefined();
    expect(session().session).toMatchObject({ status: 'phoneVerified', kycSubmission: 'submitted' });
    expect(track).not.toHaveBeenCalledWith('cash.kyc_failed', expect.anything());
  });

  it('fails and reports the failure when the submission throws', async () => {
    mockSubmitOnboarding.mockRejectedValue(new Error('network down'));

    await expect(flow().submit()).resolves.toBe('failed');

    expect(track).toHaveBeenCalledWith('cash.kyc_failed', { reason: 'unknown' });
    expect(logger.error).toHaveBeenCalled();
    expect(flow().state).toBe('error');
    expect(session().session).toMatchObject({ status: 'phoneVerified', kycSubmission: 'notSubmitted' });
  });

  it('skips a second submit while one is in flight', async () => {
    const submit = Promise.withResolvers<Awaited<ReturnType<typeof submitOnboarding>>>();
    mockSubmitOnboarding.mockReturnValue(submit.promise);

    const first = flow().submit();
    await expect(flow().submit()).resolves.toBe('skipped');

    expect(mockSubmitOnboarding).toHaveBeenCalledTimes(1);
    submit.resolve({ kycStatus: KycStatus.Approved });
    await expect(first).resolves.toBe('approved');
  });

  it('skips when the session is missing identity or government id', async () => {
    session().reset();

    await expect(flow().submit()).resolves.toBe('skipped');

    expect(mockSubmitOnboarding).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });
});
