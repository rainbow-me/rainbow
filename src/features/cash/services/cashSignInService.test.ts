import { analytics } from '@/analytics';

import { useCashAccountStore } from '../stores/cashAccountStore';
import { useCashAuthTokenStore } from '../stores/cashAuthTokenStore';
import { getPasskeyAssertion } from './cashPasskeyService';
import { ensureAccessToken, signInWithPhone } from './cashSignInService';
import { finalizeAuth, finishLogin, startLogin } from './userClient';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: {
      cashSignInSubmitted: 'cash.sign_in_submitted',
      cashSignInSucceeded: 'cash.sign_in_succeeded',
      cashSignInFailed: 'cash.sign_in_failed',
      cashSignInCancelled: 'cash.sign_in_cancelled',
    },
  },
}));

jest.mock('./userClient', () => ({
  startLogin: jest.fn(),
  finishLogin: jest.fn(),
  finalizeAuth: jest.fn(),
}));

jest.mock('./cashPasskeyService', () => ({
  getPasskeyAssertion: jest.fn(),
  isPasskeyCancellation: jest.fn((error: unknown) => error instanceof Error && error.message === 'UserCancelled'),
}));

const mockStartLogin = startLogin as jest.Mock;
const mockFinishLogin = finishLogin as jest.Mock;
const mockFinalizeAuth = finalizeAuth as jest.Mock;
const mockGetPasskeyAssertion = getPasskeyAssertion as jest.Mock;
const track = analytics.track as jest.Mock;

const USER_ID = 'user-1';
const OPTIONS_JSON = '{"publicKey":{"challenge":"abc"}}';
const ASSERTION_JSON = '{"id":"cred-1"}';

const tokenStore = () => useCashAuthTokenStore.getState();

beforeEach(() => {
  jest.clearAllMocks();
  useCashAccountStore.getState().setUserId(USER_ID);
  tokenStore().clearToken();
  mockStartLogin.mockResolvedValue({ sessionId: 'sess-1', sessionToken: 'tok-1', publicKeyOptionsJson: OPTIONS_JSON });
  mockGetPasskeyAssertion.mockResolvedValue(ASSERTION_JSON);
  mockFinishLogin.mockResolvedValue({ sessionId: 'sess-2', sessionToken: 'tok-2', userId: 'user-2' });
  mockFinalizeAuth.mockResolvedValue({ accessToken: 'jwt-1', expiresAt: Date.now() + 3_600_000 });
});

describe('ensureAccessToken', () => {
  it('runs the ceremony in order, threads the session pair, stores the token, and tracks the funnel', async () => {
    await expect(ensureAccessToken('cardLink')).resolves.toBe('jwt-1');

    expect(mockStartLogin).toHaveBeenCalledWith({ userId: USER_ID });
    expect(mockGetPasskeyAssertion).toHaveBeenCalledWith(OPTIONS_JSON);
    expect(mockFinishLogin).toHaveBeenCalledWith({ sessionId: 'sess-1', sessionToken: 'tok-1', credentialAssertionJson: ASSERTION_JSON });
    expect(mockFinalizeAuth).toHaveBeenCalledWith({ sessionId: 'sess-2', sessionToken: 'tok-2' });

    const startOrder = mockStartLogin.mock.invocationCallOrder[0];
    const assertionOrder = mockGetPasskeyAssertion.mock.invocationCallOrder[0];
    const finishOrder = mockFinishLogin.mock.invocationCallOrder[0];
    const finalizeOrder = mockFinalizeAuth.mock.invocationCallOrder[0];
    expect(startOrder).toBeLessThan(assertionOrder);
    expect(assertionOrder).toBeLessThan(finishOrder);
    expect(finishOrder).toBeLessThan(finalizeOrder);

    expect(tokenStore().token?.accessToken).toBe('jwt-1');
    expect(track.mock.calls).toEqual([
      ['cash.sign_in_submitted', { trigger: 'cardLink' }],
      ['cash.sign_in_succeeded', { trigger: 'cardLink' }],
    ]);
  });

  it('reuses an unexpired token without a ceremony or events', async () => {
    tokenStore().setToken({ accessToken: 'jwt-cached', expiresAt: Date.now() + 60_000 });

    await expect(ensureAccessToken('cardLink')).resolves.toBe('jwt-cached');
    expect(mockStartLogin).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });

  it('re-runs the ceremony when the token is within the expiry margin', async () => {
    tokenStore().setToken({ accessToken: 'jwt-dying', expiresAt: Date.now() + 10_000 });

    await expect(ensureAccessToken('cardLink')).resolves.toBe('jwt-1');
    expect(mockStartLogin).toHaveBeenCalledTimes(1);
  });

  it('shares a single in-flight ceremony between concurrent callers', async () => {
    const [first, second] = await Promise.all([ensureAccessToken('cardLink'), ensureAccessToken('cardLink')]);

    expect(first).toBe('jwt-1');
    expect(second).toBe('jwt-1');
    expect(mockStartLogin).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledTimes(2);
  });

  it('rethrows ceremony cancellation, tracks cancelled instead of failed, stores nothing', async () => {
    mockGetPasskeyAssertion.mockRejectedValue(new Error('UserCancelled'));

    await expect(ensureAccessToken('cardLink')).rejects.toThrow('UserCancelled');
    expect(mockFinishLogin).not.toHaveBeenCalled();
    expect(tokenStore().token).toBeNull();
    expect(track.mock.calls).toEqual([
      ['cash.sign_in_submitted', { trigger: 'cardLink' }],
      ['cash.sign_in_cancelled', { trigger: 'cardLink' }],
    ]);
  });

  it('propagates other failures, tracks failed with the reason, stores nothing', async () => {
    mockFinishLogin.mockRejectedValue(new Error('login rejected'));

    await expect(ensureAccessToken('cardLink')).rejects.toThrow('login rejected');
    expect(tokenStore().token).toBeNull();
    expect(track.mock.calls).toEqual([
      ['cash.sign_in_submitted', { trigger: 'cardLink' }],
      ['cash.sign_in_failed', { trigger: 'cardLink', reason: 'unknown' }],
    ]);
  });

  it('runs a fresh ceremony after a failure', async () => {
    mockFinishLogin.mockRejectedValueOnce(new Error('login rejected'));

    await expect(ensureAccessToken('cardLink')).rejects.toThrow('login rejected');
    await expect(ensureAccessToken('cardLink')).resolves.toBe('jwt-1');
    expect(mockStartLogin).toHaveBeenCalledTimes(2);
  });

  it('fails without a stored userId and never starts the ceremony', async () => {
    useCashAccountStore.getState().clearUserId();

    await expect(ensureAccessToken('cardLink')).rejects.toThrow('No cash account recorded on this device');
    expect(mockStartLogin).not.toHaveBeenCalled();
    expect(track.mock.calls).toEqual([
      ['cash.sign_in_submitted', { trigger: 'cardLink' }],
      ['cash.sign_in_failed', { trigger: 'cardLink', reason: 'unknown' }],
    ]);
  });
});

describe('signInWithPhone', () => {
  beforeEach(() => {
    useCashAccountStore.getState().clearUserId();
  });

  it('starts the ceremony with the phone identifier and persists the verified userId and token', async () => {
    await expect(signInWithPhone('4155550100')).resolves.toBeUndefined();

    expect(mockStartLogin).toHaveBeenCalledWith({ phone: { countryCode: '1', nationalNumber: '4155550100' } });
    expect(useCashAccountStore.getState().userId).toBe('user-2');
    // setUserId clears the token store — a surviving token proves it was stored after
    expect(tokenStore().token?.accessToken).toBe('jwt-1');
    expect(track.mock.calls).toEqual([
      ['cash.sign_in_submitted', { trigger: 'signInScreen' }],
      ['cash.sign_in_succeeded', { trigger: 'signInScreen' }],
    ]);
  });

  it('cancellation leaves both stores untouched and tracks cancelled', async () => {
    mockGetPasskeyAssertion.mockRejectedValue(new Error('UserCancelled'));

    await expect(signInWithPhone('4155550100')).rejects.toThrow('UserCancelled');
    expect(useCashAccountStore.getState().userId).toBeNull();
    expect(tokenStore().token).toBeNull();
    expect(track.mock.calls).toEqual([
      ['cash.sign_in_submitted', { trigger: 'signInScreen' }],
      ['cash.sign_in_cancelled', { trigger: 'signInScreen' }],
    ]);
  });

  it('keeps the verified userId when token minting fails afterwards', async () => {
    mockFinalizeAuth.mockRejectedValue(new Error('finalize failed'));

    await expect(signInWithPhone('4155550100')).rejects.toThrow('finalize failed');
    expect(useCashAccountStore.getState().userId).toBe('user-2');
    expect(tokenStore().token).toBeNull();
    expect(track.mock.calls).toEqual([
      ['cash.sign_in_submitted', { trigger: 'signInScreen' }],
      ['cash.sign_in_failed', { trigger: 'signInScreen', reason: 'unknown' }],
    ]);
  });
});
