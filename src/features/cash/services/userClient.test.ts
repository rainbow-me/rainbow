import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { getCashPlatformClient } from './cashPlatformClient';
import { createUserWithPhone, finishSignupResume, startSignupResume, verifyPhone } from './userClient';

jest.mock('react-native-dotenv', () => ({ IS_TESTING: 'false' }));

jest.mock('./cashPlatformClient', () => ({
  getCashPlatformClient: jest.fn(),
  buildAuthenticatedHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
}));

const post = jest.fn();
(getCashPlatformClient as jest.Mock).mockReturnValue({ post });

const PARAMS = { userId: 'user-1', code: '123456' };

beforeEach(() => {
  post.mockReset();
});

function platformError(code: unknown) {
  return new RainbowFetchError({ message: 'phone already registered', responseBody: { code, message: 'phone already registered' } });
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

    jest.restoreAllMocks();
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

    jest.restoreAllMocks();
  });
});
