import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { useCashAccessRefusalStore } from '../stores/cashAccessRefusalStore';
import { createUsSsnLast4GovernmentId, isValidUsSsnLast4 } from './cashSetupIdentityService';
import {
  createUserWithPhone,
  finishRecovery,
  finishSignupResume,
  getUserStatus,
  KycRejectionReasonCode,
  KycStatus,
  startRecovery,
  startSignupResume,
  submitOnboarding,
  verifyPhone,
} from './userClient';

vi.mock('react-native-dotenv', () => ({ IS_TESTING: 'false' }));

const mockPost = vi.fn();
const mockGet = vi.fn();

vi.mock('./cashPlatformClient', () => ({
  getCashPlatformClient: () => ({ post: mockPost, get: mockGet }),
  buildAuthenticatedHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
}));

const post = mockPost;
const get = mockGet;

const PARAMS = { userId: 'user-1', code: '123456' };
const IDENTITY = { firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: { year: 1815, month: 12, day: 10 } };

function governmentId() {
  const value = '1234';
  if (!isValidUsSsnLast4(value)) throw new Error('Invalid test SSN');
  return createUsSsnLast4GovernmentId(value);
}

beforeEach(() => {
  post.mockReset();
  get.mockReset();
  useCashAccessRefusalStore.getState().dismiss();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function platformError(code: unknown, httpStatus?: number) {
  return new RainbowFetchError({
    message: 'phone already registered',
    response: httpStatus === undefined ? undefined : new Response(null, { status: httpStatus }),
    responseBody: { code, message: 'phone already registered' },
  });
}

describe('access refusals', () => {
  const submit = () => createUserWithPhone({ nationalNumber: '5869132511' });

  it.each([
    { code: 600, httpStatus: 403, reason: 'networkPolicy' },
    { code: 601, httpStatus: 403, reason: 'networkPolicy' },
    { code: 602, httpStatus: 403, reason: 'networkPolicy' },
    { code: 1340, httpStatus: 403, reason: 'unavailable' },
    { code: 1340, httpStatus: 400, reason: 'unavailable' },
  ])('shows the $reason notice for HTTP $httpStatus response code $code', async ({ code, httpStatus, reason }) => {
    post.mockRejectedValue(platformError(code, httpStatus));

    await expect(submit()).rejects.toMatchObject({ name: 'CashAccessRefusedError', reason });
    expect(useCashAccessRefusalStore.getState().reason).toBe(reason);
  });

  it.each([
    { code: 603, httpStatus: 403 },
    { code: 600, httpStatus: 500 },
  ])('preserves existing handling for HTTP $httpStatus response code $code', async ({ code, httpStatus }) => {
    const error = platformError(code, httpStatus);
    post.mockRejectedValue(error);

    await expect(submit()).rejects.toBe(error);
    expect(useCashAccessRefusalStore.getState().reason).toBeNull();
  });
});

describe('createUserWithPhone', () => {
  const submit = () => createUserWithPhone({ nationalNumber: '5869132511' });

  it('maps a success response to the created outcome', async () => {
    post.mockResolvedValue({ data: { userId: 'user-1', resendAfter: '30s' } });

    await expect(submit()).resolves.toMatchObject({ outcome: 'created', userId: 'user-1' });
  });

  it.each([
    { code: 1304, outcome: 'registeredWithoutPasskey' },
    { code: 1303, outcome: 'registeredWithPasskey' },
    { code: 1300, outcome: 'alreadyRegistered' },
  ])('maps error code $code to $outcome', async ({ code, outcome }) => {
    post.mockRejectedValue(platformError(code));

    await expect(submit()).resolves.toEqual({ outcome });
  });

  it.each([platformError(1399), platformError('1304'), platformError(undefined), new Error('network down')])(
    'rethrows unrecognized errors',
    async error => {
      post.mockRejectedValue(error);

      await expect(submit()).rejects.toBe(error);
    }
  );
});

describe('startSignupResume', () => {
  it('parses the resend cooldown from the response', async () => {
    const now = 1_750_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    post.mockResolvedValue({ data: { resumeId: 'rcv_1', resendAfter: '30s' } });

    await expect(startSignupResume({ nationalNumber: '5869132511' })).resolves.toEqual({ resumeId: 'rcv_1', resendAfter: now + 30_000 });
  });
});

describe('finishSignupResume', () => {
  const submit = () => finishSignupResume({ resumeId: 'rcv_1', code: '123456' });

  it('returns the credential on success', async () => {
    post.mockResolvedValue({ data: { bootstrapToken: 'bst_test', expiresIn: '600s' } });

    await expect(submit()).resolves.toMatchObject({ outcome: 'verified', bootstrapToken: 'bst_test' });
  });

  it('maps error code 1322 to signupAlreadyComplete', async () => {
    post.mockRejectedValue(platformError(1322));

    await expect(submit()).resolves.toEqual({ outcome: 'signupAlreadyComplete' });
  });

  it('rethrows other errors', async () => {
    const error = platformError(1300);
    post.mockRejectedValue(error);

    await expect(submit()).rejects.toBe(error);
  });
});

describe('verifyPhone', () => {
  it('rejects an empty bootstrap token', async () => {
    post.mockResolvedValue({ data: { bootstrapToken: '', expiresIn: '600s' } });

    await expect(verifyPhone(PARAMS)).rejects.toThrow('invalid bootstrap token');
  });

  it('rejects a token without the contract prefix', async () => {
    post.mockResolvedValue({ data: { bootstrapToken: 'token-1', expiresIn: '600s' } });

    await expect(verifyPhone(PARAMS)).rejects.toThrow('invalid bootstrap token');
  });

  it.each(['300', '0s', '-1s', 'NaNs', '1.0000000001s', 600, undefined])('rejects invalid expiry %o', async expiresIn => {
    post.mockResolvedValue({ data: { bootstrapToken: 'bst_test', expiresIn } });

    await expect(verifyPhone(PARAMS)).rejects.toThrow('invalid bootstrap token expiry');
  });

  it.each(['300s', '300.5s', '1.000340012s'])('accepts contract-valid expiry %s', async expiresIn => {
    post.mockResolvedValue({ data: { bootstrapToken: 'bst_test', expiresIn } });

    await expect(verifyPhone(PARAMS)).resolves.toMatchObject({ bootstrapToken: 'bst_test' });
  });

  it('converts the duration into an absolute expiry', async () => {
    const now = 1_750_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    post.mockResolvedValue({ data: { bootstrapToken: 'bst_test', expiresIn: '600s' } });

    await expect(verifyPhone(PARAMS)).resolves.toEqual({ bootstrapToken: 'bst_test', expiresAt: now + 600_000 });
  });
});

describe('account recovery', () => {
  const finishParams = {
    recoveryId: 'recovery-1',
    code: '123456',
    identity: IDENTITY,
    governmentId: governmentId(),
  };

  it('starts the personal-details recovery method', async () => {
    const now = 1_750_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    post.mockResolvedValue({
      data: { recoveryId: 'recovery-1', methods: ['RECOVERY_METHOD_PERSONAL_DETAILS'], resendAfter: '30s' },
    });

    await expect(startRecovery({ nationalNumber: '5869132511' })).resolves.toEqual({
      recoveryId: 'recovery-1',
      resendAfter: now + 30_000,
    });
    expect(post).toHaveBeenCalledWith('/recovery/StartRecovery', {
      phone: { countryCode: '1', nationalNumber: '5869132511' },
    });
  });

  it('rejects a response without a supported recovery method', async () => {
    post.mockResolvedValue({ data: { recoveryId: 'recovery-1', resendAfter: '30s' } });

    await expect(startRecovery({ nationalNumber: '5869132511' })).rejects.toThrow('no supported recovery method');
  });

  it('submits the OTP and personal details and returns the bootstrap credential', async () => {
    post.mockResolvedValue({ data: { bootstrapToken: 'bst_recovered', expiresIn: '600s' } });

    await expect(finishRecovery(finishParams)).resolves.toMatchObject({ outcome: 'recovered', bootstrapToken: 'bst_recovered' });
    expect(post).toHaveBeenCalledWith('/recovery/FinishRecovery', {
      recoveryId: 'recovery-1',
      code: '123456',
      personalDetails: {
        countryCode: 'US',
        legalName: { firstName: 'Ada', lastName: 'Lovelace' },
        dateOfBirth: { year: 1815, month: 12, day: 10 },
        governmentId: finishParams.governmentId,
      },
    });
  });

  it.each([
    { code: 403, httpStatus: 403, outcome: 'identityMismatch' },
    { code: 1320, outcome: 'sessionInvalid' },
    { code: 1321, outcome: 'codeInvalid' },
    { code: 1323, outcome: 'signupIncomplete' },
    { code: 1340, httpStatus: 403, outcome: 'accessBlocked' },
  ])('maps recovery error body code $code to $outcome', async ({ code, httpStatus, outcome }) => {
    post.mockRejectedValue(platformError(code, httpStatus));

    await expect(finishRecovery(finishParams)).resolves.toEqual({ outcome });
    expect(useCashAccessRefusalStore.getState().reason).toBeNull();
  });

  it('shows the network policy notice for a policy-blocked recovery', async () => {
    post.mockRejectedValue(platformError(600, 403));

    await expect(finishRecovery(finishParams)).rejects.toMatchObject({ reason: 'networkPolicy' });
    expect(useCashAccessRefusalStore.getState().reason).toBe('networkPolicy');
  });

  it('rethrows an unrecognized HTTP 403 recovery error', async () => {
    const error = platformError(7, 403);
    post.mockRejectedValue(error);

    await expect(finishRecovery(finishParams)).rejects.toBe(error);
  });
});

describe('submitOnboarding', () => {
  const submit = () =>
    submitOnboarding({ bootstrapToken: 'bst_test', countryCode: 'US', identity: IDENTITY, governmentId: governmentId() });

  it('omits the rejection reason when the provider approves', async () => {
    post.mockResolvedValue({ data: { kycStatus: KycStatus.Approved } });

    await expect(submit()).resolves.toEqual({ kycStatus: KycStatus.Approved, kycRejectionReason: undefined });
  });

  it.each([
    { countryCode: 'US', regionCode: 'NY', regionName: 'New York' },
    { countryCode: 'US', regionCode: 'CA', regionName: 'California' },
    undefined,
  ])('surfaces a state-not-supported rejection with %j', async unsupportedLocation => {
    post.mockResolvedValue({
      data: { kycStatus: KycStatus.Rejected, kycRejectionReason: 'KYC_REJECTION_REASON_STATE_NOT_SUPPORTED', unsupportedLocation },
    });

    await expect(submit()).resolves.toEqual({
      kycStatus: KycStatus.Rejected,
      kycRejectionReason: { code: KycRejectionReasonCode.StateNotSupported, unsupportedLocation },
    });
  });

  it.each([undefined, KycRejectionReasonCode.Unspecified])('preserves a plain rejection with reason %s', async code => {
    post.mockResolvedValue({ data: { kycStatus: KycStatus.Rejected, kycRejectionReason: code } });

    await expect(submit()).resolves.toEqual({ kycStatus: KycStatus.Rejected, kycRejectionReason: code ? { code } : undefined });
  });
});

describe('getUserStatus', () => {
  const params = { bootstrapToken: 'bst_test' };

  it('shows the unavailable notice instead of a KYC verdict for a blocked account', async () => {
    get.mockResolvedValue({ data: { status: { access: { status: 'ACCESS_STATUS_BLOCKED' }, kyc: { status: KycStatus.Approved } } } });

    await expect(getUserStatus(params)).rejects.toMatchObject({ name: 'CashAccessRefusedError', reason: 'unavailable' });
    expect(useCashAccessRefusalStore.getState().reason).toBe('unavailable');
  });

  it('omits the rejection reason when the provider approves', async () => {
    get.mockResolvedValue({ data: { status: { access: { status: 'ACCESS_STATUS_ACTIVE' }, kyc: { status: KycStatus.Approved } } } });

    await expect(getUserStatus(params)).resolves.toEqual({ kycStatus: KycStatus.Approved, kycRejectionReason: undefined });
  });

  it.each([
    { countryCode: 'US', regionCode: 'NY', regionName: 'New York' },
    { countryCode: 'US', regionCode: 'CA', regionName: 'California' },
    undefined,
  ])('surfaces a state-not-supported rejection with %j', async unsupportedLocation => {
    get.mockResolvedValue({
      data: { status: { kyc: { status: KycStatus.Rejected, reason: 'KYC_REJECTION_REASON_STATE_NOT_SUPPORTED', unsupportedLocation } } },
    });

    await expect(getUserStatus(params)).resolves.toEqual({
      kycStatus: KycStatus.Rejected,
      kycRejectionReason: { code: KycRejectionReasonCode.StateNotSupported, unsupportedLocation },
    });
  });

  it.each([undefined, KycRejectionReasonCode.Unspecified])('preserves a plain rejection with reason %s', async code => {
    get.mockResolvedValue({ data: { status: { kyc: { status: KycStatus.Rejected, reason: code } } } });

    await expect(getUserStatus(params)).resolves.toEqual({
      kycStatus: KycStatus.Rejected,
      kycRejectionReason: code ? { code } : undefined,
    });
  });
});
