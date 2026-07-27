import { getCashPlatformClient } from './cashPlatformClient';
import { verifyPhone } from './userClient';

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
