import { analytics } from '@/analytics';
import { logger } from '@/logger';

import { resendPhoneCode, verifyPhone } from '../../../services/userClient';
import { useCashSetupSessionStore } from '../../../stores/cashSetupSessionStore';
import { useVerifyPhoneFlowStore } from './useVerifyPhoneFlow';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: { cashPhoneVerified: 'cash.phone_verified', cashPhoneVerifyFailed: 'cash.phone_verify_failed' },
  },
}));

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('../../../services/userClient', () => ({
  resendPhoneCode: jest.fn(),
  verifyPhone: jest.fn(),
}));

jest.mock('../useCashDepositSetupNavigation', () => ({
  useCashDepositSetupNavigation: jest.fn(),
}));

const mockVerifyPhone = verifyPhone as jest.Mock;
const mockResendPhoneCode = resendPhoneCode as jest.Mock;
const track = analytics.track as jest.Mock;

const CODE = '123456';
const TOKEN = { bootstrapToken: 'bst_1', expiresAt: 1_750_000_000_000 };
const RESEND_AFTER = 1_750_000_030_000;

const flow = () => useVerifyPhoneFlowStore.getState();
const store = () => useCashSetupSessionStore.getState();
const session = () => store().session;

beforeEach(() => {
  jest.clearAllMocks();
  store().reset();
  store().setPhoneSubmitted({ userId: 'user-1', phoneNationalNumber: '4155550100', resendAfter: 0 });
  useVerifyPhoneFlowStore.getState().reset();
  mockVerifyPhone.mockResolvedValue(TOKEN);
  mockResendPhoneCode.mockResolvedValue({ resendAfter: RESEND_AFTER });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useVerifyPhoneFlowStore.submit', () => {
  it('verifies the code, stores the token, tracks, then resets to a clean entry state', async () => {
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe(true);

    expect(mockVerifyPhone).toHaveBeenCalledWith({ userId: 'user-1', code: CODE });
    expect(session()).toMatchObject({
      status: 'phoneVerified',
      bootstrapToken: TOKEN.bootstrapToken,
      bootstrapTokenExpiresAt: TOKEN.expiresAt,
    });
    expect(track).toHaveBeenCalledWith('cash.phone_verified');
    expect(flow().state).toBe('entry');
    expect(flow().code).toBe('');
  });

  it('clears the code, stores no token, and reports the failure when verification throws', async () => {
    mockVerifyPhone.mockRejectedValue(new Error('wrong code'));
    flow().setCode(CODE);

    await expect(flow().submit()).resolves.toBe(false);

    expect(flow().state).toBe('error');
    expect(flow().code).toBe('');
    expect(session().status).toBe('phoneSubmitted');
    expect(track).toHaveBeenCalledWith('cash.phone_verify_failed', { reason: 'wrong code' });
    expect(track).not.toHaveBeenCalledWith('cash.phone_verified');
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns to entry when the code is edited after an error', async () => {
    mockVerifyPhone.mockRejectedValue(new Error('wrong code'));
    flow().setCode(CODE);
    await flow().submit();
    expect(flow().state).toBe('error');

    flow().setCode('1');

    expect(flow().state).toBe('entry');
    expect(flow().code).toBe('1');
  });

  it('ignores an incomplete code', async () => {
    flow().setCode('12345');

    await expect(flow().submit()).resolves.toBe(false);

    expect(mockVerifyPhone).not.toHaveBeenCalled();
    expect(flow().state).toBe('entry');
  });

  it('discards a verification that resolves after the session was replaced', async () => {
    let resolveVerify!: (value: typeof TOKEN) => void;
    mockVerifyPhone.mockReturnValue(
      new Promise(resolve => {
        resolveVerify = resolve;
      })
    );
    flow().setCode(CODE);

    const pending = flow().submit();
    store().setPhoneSubmitted({ userId: 'user-2', phoneNationalNumber: '4155550101', resendAfter: 0 });
    resolveVerify(TOKEN);

    await expect(pending).resolves.toBe(false);
    expect(session()).toMatchObject({ status: 'phoneSubmitted', userId: 'user-2' });
    expect(track).not.toHaveBeenCalledWith('cash.phone_verified');
  });

  it('ignores a second submit while verifying', async () => {
    let resolveVerify!: (value: typeof TOKEN) => void;
    mockVerifyPhone.mockReturnValue(
      new Promise(resolve => {
        resolveVerify = resolve;
      })
    );
    flow().setCode(CODE);

    const first = flow().submit();
    await expect(flow().submit()).resolves.toBe(false);

    expect(mockVerifyPhone).toHaveBeenCalledTimes(1);
    resolveVerify(TOKEN);
    await expect(first).resolves.toBe(true);
  });
});

describe('useVerifyPhoneFlowStore.resend', () => {
  it('resends only after the backend resendAfter time, then stores the next backend resendAfter', async () => {
    const now = 1_750_000_000_000;
    const dateNow = jest.spyOn(Date, 'now').mockReturnValue(now);
    store().setResendAfter(now + 1);

    await flow().resend();
    expect(mockResendPhoneCode).not.toHaveBeenCalled();

    dateNow.mockReturnValue(now + 1);
    await flow().resend();
    expect(mockResendPhoneCode).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(session()).toMatchObject({ status: 'phoneSubmitted', resendAfter: RESEND_AFTER });
  });

  it('discards a resend that resolves after the session was replaced', async () => {
    let resolveResend!: (value: { resendAfter: number }) => void;
    mockResendPhoneCode.mockReturnValue(
      new Promise(resolve => {
        resolveResend = resolve;
      })
    );

    const pending = flow().resend();
    store().setPhoneSubmitted({ userId: 'user-2', phoneNationalNumber: '4155550101', resendAfter: 0 });
    resolveResend({ resendAfter: RESEND_AFTER });

    await pending;
    expect(session()).toMatchObject({ status: 'phoneSubmitted', userId: 'user-2', resendAfter: 0 });
    expect(flow().resending).toBe(false);
  });

  it('ignores a second resend while one is pending', async () => {
    let resolveResend!: (value: { resendAfter: number }) => void;
    mockResendPhoneCode.mockReturnValue(
      new Promise(resolve => {
        resolveResend = resolve;
      })
    );

    const first = flow().resend();
    await flow().resend();
    expect(mockResendPhoneCode).toHaveBeenCalledTimes(1);

    resolveResend({ resendAfter: RESEND_AFTER });
    await first;
    expect(flow().resending).toBe(false);
  });
});
