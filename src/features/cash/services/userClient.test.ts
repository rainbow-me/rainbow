import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { createUsSsnLast4GovernmentId, isValidUsSsnLast4 } from './cashSetupIdentityService';
import { createUserWithPhone, finishRecovery, finishSignupResume, startRecovery, startSignupResume, verifyPhone } from './userClient';

jest.mock('react-native-dotenv', () => ({ IS_TESTING: 'false' }));

const mockPost = jest.fn();

jest.mock('./cashPlatformClient', () => ({
  getCashPlatformClient: () => ({ post: mockPost }),
  buildAuthenticatedHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
}));

const post = mockPost;

const PARAMS = { userId: 'user-1', code: '123456' };
const IDENTITY = { firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: { year: 1815, month: 12, day: 10 } };

function governmentId() {
  const value = '1234';
  if (!isValidUsSsnLast4(value)) throw new Error('Invalid test SSN');
  return createUsSsnLast4GovernmentId(value);
}

beforeEach(() => {
  post.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

function platformError(code: unknown, httpStatus?: number) {
  return new RainbowFetchError({
    message: 'phone already registered',
    response: httpStatus === undefined ? undefined : new Response(null, { status: httpStatus }),
    responseBody: { code, message: 'phone already registered' },
  });
}

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
    jest.spyOn(Date, 'now').mockReturnValue(now);
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

  it.each(['300', '0s', '-1s', 'NaNs', '1.0000000001s', 600, undefined])('rejects invalid expiry %p', async expiresIn => {
    post.mockResolvedValue({ data: { bootstrapToken: 'bst_test', expiresIn } });

    await expect(verifyPhone(PARAMS)).rejects.toThrow('invalid bootstrap token expiry');
  });

  it.each(['300s', '300.5s', '1.000340012s'])('accepts contract-valid expiry %s', async expiresIn => {
    post.mockResolvedValue({ data: { bootstrapToken: 'bst_test', expiresIn } });

    await expect(verifyPhone(PARAMS)).resolves.toMatchObject({ bootstrapToken: 'bst_test' });
  });

  it('converts the duration into an absolute expiry', async () => {
    const now = 1_750_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
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
    jest.spyOn(Date, 'now').mockReturnValue(now);
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
  });

  it('rethrows an unrecognized HTTP 403 recovery error', async () => {
    const error = platformError(7, 403);
    post.mockRejectedValue(error);

    await expect(finishRecovery(finishParams)).rejects.toBe(error);
  });
});
