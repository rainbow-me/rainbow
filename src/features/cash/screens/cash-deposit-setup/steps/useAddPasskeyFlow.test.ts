import { analytics } from '@/analytics';
import { logger } from '@/logger';

import { createPasskeyCredential } from '../../../services/cashPasskeyService';
import { listCards } from '../../../services/rampClient';
import { addPasskey, finishAddPasskey } from '../../../services/userClient';
import { useCashAccountStore } from '../../../stores/cashAccountStore';
import { useCashPaymentMethodStore } from '../../../stores/cashPaymentMethodStore';
import { useCashSetupSessionStore, type RecoveryPhoneChallenge } from '../../../stores/cashSetupSessionStore';
import { useAddPasskeyFlowStore } from './useAddPasskeyFlow';

jest.mock('@/analytics', () => ({
  analytics: {
    track: jest.fn(),
    event: {
      cashPasskeySubmitted: 'cash.passkey_submitted',
      cashPasskeyAdded: 'cash.passkey_added',
      cashPasskeyFailed: 'cash.passkey_failed',
    },
  },
}));

jest.mock('@/logger', () => ({
  logger: { debug: jest.fn(), error: jest.fn(), warn: jest.fn() },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('../../../services/userClient', () => ({
  addPasskey: jest.fn(),
  finishAddPasskey: jest.fn(),
}));

jest.mock('../../../services/rampClient', () => ({
  listCards: jest.fn(),
}));

jest.mock('../../../services/cashPasskeyService', () => ({
  createPasskeyCredential: jest.fn(),
  getPasskeyName: jest.fn(() => 'iPhone 15 Pro'),
  isPasskeyCancellation: jest.fn((error: unknown) => error instanceof Error && error.message === 'UserCancelled'),
}));

jest.mock('../../../stores/cashAccountStore', () => {
  const state = { userId: null, setUserId: jest.fn(), clearUserId: jest.fn() };
  return { useCashAccountStore: { getState: jest.fn(() => state) } };
});

jest.mock('../../../stores/cashPaymentMethodStore', () => {
  const state = { linkedCard: null, setLinkedCard: jest.fn(), clearLinkedCard: jest.fn() };
  return { useCashPaymentMethodStore: { getState: jest.fn(() => state) } };
});

const mockAddPasskey = jest.mocked(addPasskey);
const mockFinishAddPasskey = jest.mocked(finishAddPasskey);
const mockCreatePasskeyCredential = jest.mocked(createPasskeyCredential);
const mockListCards = jest.mocked(listCards);
const track = jest.mocked(analytics.track);
const setUserId = jest.mocked(useCashAccountStore.getState().setUserId);
const setLinkedCard = jest.mocked(useCashPaymentMethodStore.getState().setLinkedCard);

const TOKEN = 'bst_1';
const OPTIONS_JSON = '{"publicKey":{"challenge":"abc"}}';
const CREDENTIAL_JSON = '{"id":"cred-1"}';
const LINKED_CARD = { id: 'card-1', brand: 'Visa', last4: '4242' };

const flow = () => useAddPasskeyFlowStore.getState();
const session = () => useCashSetupSessionStore.getState();
const challenge = () => {
  const current = session().session;
  if (current.status !== 'phoneSubmitted') throw new Error('expected a phoneSubmitted session');
  return current.challenge;
};
const verifyRecoverySession = () => {
  session().reset();
  const recoveryChallenge: RecoveryPhoneChallenge = { kind: 'recovery', recoveryId: 'recovery-1' };
  session().setPhoneSubmitted({ challenge: recoveryChallenge, phoneNationalNumber: '4155550100', resendAfter: 0 });
  session().setFirstName('Ada');
  session().setLastName('Lovelace');
  session().setDateOfBirth({ year: 1815, month: 12, day: 10 });
  session().setSsnLast4('1234');
  session().setPhoneVerified(recoveryChallenge, { bootstrapToken: TOKEN, expiresAt: Date.now() + 60_000 });
};
const verifyResumeSession = () => {
  session().reset();
  const resumeChallenge = { kind: 'resume', resumeId: 'resume-1' } as const;
  session().setPhoneSubmitted({ challenge: resumeChallenge, phoneNationalNumber: '4155550100', resendAfter: 0 });
  session().setPhoneVerified(resumeChallenge, { bootstrapToken: TOKEN, expiresAt: Date.now() + 60_000 });
};

beforeEach(() => {
  jest.clearAllMocks();
  flow().reset();
  session().reset();
  session().setPhoneSubmitted({ challenge: { kind: 'signup', userId: 'user-1' }, phoneNationalNumber: '4155550100', resendAfter: 0 });
  session().setPhoneVerified(challenge(), { bootstrapToken: TOKEN, expiresAt: Date.now() + 60_000 });
  mockAddPasskey.mockResolvedValue({ passkeyId: 'pk-1', publicKeyOptionsJson: OPTIONS_JSON, userId: 'user-1' });
  mockCreatePasskeyCredential.mockResolvedValue(CREDENTIAL_JSON);
  mockFinishAddPasskey.mockResolvedValue(undefined);
  mockListCards.mockResolvedValue([]);
});

describe('useAddPasskeyFlowStore.submit', () => {
  it('enrolls, stores the userId, tracks, and resolves completed — in order', async () => {
    await expect(flow().submit()).resolves.toBe('completed');

    expect(mockAddPasskey).toHaveBeenCalledWith({ bootstrapToken: TOKEN });
    expect(mockCreatePasskeyCredential).toHaveBeenCalledWith(OPTIONS_JSON);
    expect(mockFinishAddPasskey).toHaveBeenCalledWith({
      bootstrapToken: TOKEN,
      passkeyId: 'pk-1',
      credentialCreationJson: CREDENTIAL_JSON,
      passkeyName: 'iPhone 15 Pro',
    });
    expect(setUserId).toHaveBeenCalledWith('user-1');
    expect(mockListCards).not.toHaveBeenCalled();
    expect(track).toHaveBeenNthCalledWith(1, 'cash.passkey_submitted');
    expect(track).toHaveBeenNthCalledWith(2, 'cash.passkey_added');

    const [addOrder] = mockAddPasskey.mock.invocationCallOrder;
    const [ceremonyOrder] = mockCreatePasskeyCredential.mock.invocationCallOrder;
    const [finishOrder] = mockFinishAddPasskey.mock.invocationCallOrder;
    const [setUserIdOrder] = setUserId.mock.invocationCallOrder;
    expect(addOrder).toBeLessThan(ceremonyOrder);
    expect(ceremonyOrder).toBeLessThan(finishOrder);
    expect(finishOrder).toBeLessThan(setUserIdOrder);

    expect(flow().state).toBe('entry');
  });

  it('resolves cancelled when the user dismisses the ceremony — no userId, no failure event', async () => {
    mockCreatePasskeyCredential.mockRejectedValue(new Error('UserCancelled'));

    await expect(flow().submit()).resolves.toBe('cancelled');

    expect(mockFinishAddPasskey).not.toHaveBeenCalled();
    expect(setUserId).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('cash.passkey_submitted');
    expect(logger.error).not.toHaveBeenCalled();
    expect(flow().state).toBe('entry');
  });

  it('fails and reports the failure when the ceremony throws', async () => {
    mockCreatePasskeyCredential.mockRejectedValue(new Error('ceremony broke'));

    await expect(flow().submit()).resolves.toBe('failed');

    expect(track).toHaveBeenCalledWith('cash.passkey_failed', { reason: 'unknown' });
    expect(setUserId).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
    expect(flow().state).toBe('error');
  });

  it('fails without storing the userId when FinishAddPasskey throws', async () => {
    mockFinishAddPasskey.mockRejectedValue(new Error('network down'));

    await expect(flow().submit()).resolves.toBe('failed');

    expect(track).toHaveBeenCalledWith('cash.passkey_failed', { reason: 'unknown' });
    expect(setUserId).not.toHaveBeenCalled();
  });

  it('retries the whole enrollment after a failure — a fresh challenge', async () => {
    mockAddPasskey.mockRejectedValueOnce(new Error('network down'));

    await expect(flow().submit()).resolves.toBe('failed');
    await expect(flow().submit()).resolves.toBe('completed');

    expect(mockAddPasskey).toHaveBeenCalledTimes(2);
    expect(setUserId).toHaveBeenCalledWith('user-1');
  });

  it('restores the recovered account card after passkey enrollment', async () => {
    verifyRecoverySession();
    mockListCards.mockResolvedValue([LINKED_CARD]);

    await expect(flow().submit()).resolves.toBe('recovered');

    expect(mockListCards).toHaveBeenCalledWith({ trigger: 'recovery' });
    expect(setLinkedCard).toHaveBeenCalledWith(LINKED_CARD);
    expect(setUserId).toHaveBeenCalledWith('user-1');
    expect(mockFinishAddPasskey).toHaveBeenCalledTimes(1);
  });

  it('restores the resumed account card after passkey enrollment', async () => {
    verifyResumeSession();
    mockListCards.mockResolvedValue([LINKED_CARD]);

    await expect(flow().submit()).resolves.toBe('completed');

    expect(mockListCards).toHaveBeenCalledWith({ trigger: 'resume' });
    expect(setLinkedCard).toHaveBeenCalledWith(LINKED_CARD);

    const [finishOrder] = mockFinishAddPasskey.mock.invocationCallOrder;
    const [setUserIdOrder] = setUserId.mock.invocationCallOrder;
    const [listCardsOrder] = mockListCards.mock.invocationCallOrder;
    const [setLinkedCardOrder] = setLinkedCard.mock.invocationCallOrder;
    expect(finishOrder).toBeLessThan(setUserIdOrder);
    expect(setUserIdOrder).toBeLessThan(listCardsOrder);
    expect(listCardsOrder).toBeLessThan(setLinkedCardOrder);
  });

  it('completes recovery when card restoration fails after passkey enrollment', async () => {
    verifyRecoverySession();
    mockListCards.mockRejectedValue(new Error('network down'));

    await expect(flow().submit()).resolves.toBe('recovered');

    expect(setUserId).toHaveBeenCalledWith('user-1');
    expect(mockAddPasskey).toHaveBeenCalledTimes(1);
    expect(mockFinishAddPasskey).toHaveBeenCalledTimes(1);
    expect(track).not.toHaveBeenCalledWith('cash.passkey_failed', expect.anything());
    expect(logger.error).toHaveBeenCalled();
  });

  it('skips a second submit while one is in flight', async () => {
    let resolveAdd!: (value: { passkeyId: string; publicKeyOptionsJson: string; userId: string }) => void;
    mockAddPasskey.mockReturnValue(
      new Promise(resolve => {
        resolveAdd = resolve;
      })
    );

    const first = flow().submit();
    await expect(flow().submit()).resolves.toBe('skipped');

    expect(mockAddPasskey).toHaveBeenCalledTimes(1);
    resolveAdd({ passkeyId: 'pk-1', publicKeyOptionsJson: OPTIONS_JSON, userId: 'user-1' });
    await expect(first).resolves.toBe('completed');
  });

  it('skips when the session is not phone-verified', async () => {
    session().reset();

    await expect(flow().submit()).resolves.toBe('skipped');

    expect(mockAddPasskey).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });
});
