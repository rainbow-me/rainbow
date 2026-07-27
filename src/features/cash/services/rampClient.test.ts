import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { useCashAuthTokenStore } from '../stores/cashAuthTokenStore';
import { getCashPlatformClient } from './cashPlatformClient';
import { ensureAccessToken } from './cashSignInService';
import { completeCardLinkSession, startCardLinkSession } from './rampClient';

jest.mock('./cashPlatformClient', () => ({
  getCashPlatformClient: jest.fn(),
  buildAuthenticatedHeader: (token: string) => ({ Authorization: `Bearer ${token}` }),
}));

jest.mock('./cashSignInService', () => ({
  ensureAccessToken: jest.fn(),
}));

const post = jest.fn();
const mockEnsureAccessToken = ensureAccessToken as jest.Mock;

const SESSION = { linkUrl: 'https://link', token: 'vault-token', tokenExpiresTime: '2026-07-24T00:00:00Z' };

function fetchError(status: number, message: string) {
  return new RainbowFetchError({ message, response: { status } as unknown as Response });
}

beforeEach(() => {
  jest.clearAllMocks();
  (getCashPlatformClient as jest.Mock).mockReturnValue({ post });
  mockEnsureAccessToken.mockResolvedValue('jwt-1');
  useCashAuthTokenStore.getState().setToken({ accessToken: 'jwt-1', expiresAt: Date.now() + 60_000 });
  post.mockResolvedValue({ data: SESSION });
});

describe('startCardLinkSession', () => {
  it('sends the user JWT as the bearer', async () => {
    await expect(startCardLinkSession()).resolves.toEqual(SESSION);

    expect(mockEnsureAccessToken).toHaveBeenCalledWith('cardLink');
    expect(post).toHaveBeenCalledWith(
      '/ramp/payment-methods/link-card-session',
      {},
      { abortController: undefined, headers: { Authorization: 'Bearer jwt-1' } }
    );
  });

  it('on 401 clears the cached token, signs in again, and retries once', async () => {
    post.mockRejectedValueOnce(fetchError(401, 'unauthorized'));
    mockEnsureAccessToken.mockResolvedValueOnce('jwt-stale').mockResolvedValueOnce('jwt-fresh');

    await expect(startCardLinkSession()).resolves.toEqual(SESSION);

    expect(useCashAuthTokenStore.getState().token).toBeNull();
    expect(mockEnsureAccessToken).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][2].headers).toEqual({ Authorization: 'Bearer jwt-fresh' });
  });

  it('propagates a second 401 without further retries', async () => {
    post.mockRejectedValue(fetchError(401, 'unauthorized'));

    await expect(startCardLinkSession()).rejects.toThrow('unauthorized');
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('propagates non-401 errors without retrying', async () => {
    post.mockRejectedValue(fetchError(500, 'server error'));

    await expect(startCardLinkSession()).rejects.toThrow('server error');
    expect(post).toHaveBeenCalledTimes(1);
    expect(useCashAuthTokenStore.getState().token).not.toBeNull();
  });
});

describe('completeCardLinkSession', () => {
  it('sends the provider card id and bearer', async () => {
    post.mockResolvedValue({ data: { card: { id: 'card-1', lastFourDigits: '8990' } } });

    await completeCardLinkSession({ providerCardId: 'prov-1' });
    expect(post).toHaveBeenCalledWith(
      '/ramp/payment-methods/link-card-session/complete',
      { providerCardId: 'prov-1' },
      { abortController: undefined, headers: { Authorization: 'Bearer jwt-1' } }
    );
  });
});
