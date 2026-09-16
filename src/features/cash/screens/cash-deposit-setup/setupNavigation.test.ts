import { useCashAccountStore } from '../../stores/cashAccountStore';
import { useCashSetupSessionStore, type PhoneChallenge, type PhoneVerificationChallenge } from '../../stores/cashSetupSessionStore';
import { useKycReturnFlowStore } from '../../stores/kycReturnFlowStore';
import { useVerifyPhoneFlowStore } from '../../stores/verifyPhoneFlowStore';
import { abandonSetupSession, endSetupSession } from './setupNavigation';
import { useSubmitReviewFlowStore } from './steps/useSubmitReviewFlow';

jest.mock('@/navigation/Navigation', () => ({
  goBack: jest.fn(),
  navigate: jest.fn(),
}));

jest.mock('../../stores/kycReturnFlowStore', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return { useKycReturnFlowStore: createBaseStore(() => ({ state: 'idle' })) };
});

jest.mock('../../stores/verifyPhoneFlowStore', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return { useVerifyPhoneFlowStore: createBaseStore(() => ({ kycOutcome: null })) };
});

jest.mock('./steps/useSubmitReviewFlow', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return { useSubmitReviewFlowStore: createBaseStore(() => ({ state: 'entry' })) };
});

const CHALLENGE: PhoneVerificationChallenge = { kind: 'signup', userId: 'user-1' };

const session = () => useCashSetupSessionStore.getState().session;

function verifyPhone(expiresAt = Date.now() + 60_000, challenge: PhoneChallenge = CHALLENGE) {
  const store = useCashSetupSessionStore.getState();
  store.setPhoneSubmitted({ challenge, phoneNationalNumber: '4155550100', resendAfter: 0 });
  store.setPhoneVerified(challenge, { bootstrapToken: 'bst_1', expiresAt });
}

beforeEach(() => {
  useCashAccountStore.getState().clearUserId();
  useCashSetupSessionStore.getState().reset();
  useKycReturnFlowStore.setState({ state: 'idle' });
  useVerifyPhoneFlowStore.setState({ kycOutcome: null });
  useSubmitReviewFlowStore.setState({ state: 'entry' });
});

describe('endSetupSession', () => {
  it('keeps a live phone verification for a prompt return', () => {
    verifyPhone();

    endSetupSession();

    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: 'bst_1' });
  });

  it('keeps the submitted phase for a prompt return', () => {
    verifyPhone();
    useCashSetupSessionStore.getState().markKycSubmitted('bst_1');

    endSetupSession();

    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: 'bst_1', kycSubmission: 'submitted' });
  });

  it('conservatively keeps an in-flight submission non-submittable after teardown', () => {
    verifyPhone();
    useSubmitReviewFlowStore.setState({ state: 'submitting' });

    endSetupSession();

    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: 'bst_1', kycSubmission: 'submitted' });
  });

  it('drops an expired verification', () => {
    verifyPhone(Date.now() - 1);

    endSetupSession();

    expect(session()).toEqual({ status: 'empty' });
  });

  it('drops the session once a passkey account exists', () => {
    verifyPhone();
    useCashAccountStore.getState().setUserId('user-1');

    endSetupSession();

    expect(session()).toEqual({ status: 'empty' });
  });

  it.each([
    { path: 'live submission', arrange: () => useSubmitReviewFlowStore.setState({ state: 'rejected' }) },
    { path: 'resume OTP', arrange: () => useVerifyPhoneFlowStore.setState({ kycOutcome: 'rejected' }) },
    { path: 'return check', arrange: () => useKycReturnFlowStore.setState({ state: 'rejected' }) },
  ])('drops the session after a rejected verdict from the $path', ({ arrange }) => {
    verifyPhone();
    arrange();

    endSetupSession();

    expect(session()).toEqual({ status: 'empty' });
  });

  it('drops a recovered account: its token only enrols the passkey', () => {
    verifyPhone(undefined, { kind: 'recovery', recoveryId: 'rcv_1' });

    endSetupSession();

    expect(session()).toEqual({ status: 'empty' });
  });

  it.each([
    { path: 'live submission', arrange: () => useSubmitReviewFlowStore.setState({ state: 'reviewing' }) },
    { path: 'resume OTP', arrange: () => useVerifyPhoneFlowStore.setState({ kycOutcome: 'reviewing' }) },
    { path: 'return check', arrange: () => useKycReturnFlowStore.setState({ state: 'reviewing' }) },
  ])('keeps the session while the $path is still reviewing', ({ arrange }) => {
    verifyPhone();
    arrange();

    endSetupSession();

    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: 'bst_1' });
  });

  it('drops anything short of a verified phone', () => {
    useCashSetupSessionStore.getState().setPhoneSubmitted({ challenge: CHALLENGE, phoneNationalNumber: '4155550100', resendAfter: 0 });

    endSetupSession();

    expect(session()).toEqual({ status: 'empty' });
  });
});

describe('abandonSetupSession', () => {
  it('drops a resumable verification after explicit cancellation', () => {
    verifyPhone();

    abandonSetupSession();

    expect(session()).toEqual({ status: 'empty' });
  });
});
