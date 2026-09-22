import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

import { useCashAccountStore } from '../../stores/cashAccountStore';
import { useCashSetupSessionStore, type PhoneChallenge, type PhoneVerificationChallenge } from '../../stores/cashSetupSessionStore';
import { useKycReturnFlowStore } from '../../stores/kycReturnFlowStore';
import { useVerifyPhoneFlowStore } from '../../stores/verifyPhoneFlowStore';
import { CashDepositSetupNavigation } from './cashDepositSetupNavigator';
import { endSetupSession, restartSetupWithoutCredential } from './setupNavigation';
import { useAddPasskeyFlowStore } from './steps/useAddPasskeyFlow';
import { useSubmitReviewFlowStore } from './steps/useSubmitReviewFlow';

jest.mock('@/navigation/Navigation', () => ({
  goBack: jest.fn(),
  navigate: jest.fn(),
}));

jest.mock('../../stores/kycReturnFlowStore', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return {
    useKycReturnFlowStore: createBaseStore<{ reset: () => void; state: string }>(set => ({
      state: 'idle',
      reset: () => set({ state: 'idle' }),
    })),
  };
});

jest.mock('../../stores/verifyPhoneFlowStore', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return {
    useVerifyPhoneFlowStore: createBaseStore<{ kycOutcome: string | null; reset: () => void }>(set => ({
      kycOutcome: null,
      reset: () => set({ kycOutcome: null }),
    })),
  };
});

jest.mock('./steps/useSubmitReviewFlow', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return {
    useSubmitReviewFlowStore: createBaseStore<{ reset: () => void; state: string }>(set => ({
      state: 'entry',
      reset: () => set({ state: 'entry' }),
    })),
  };
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
  useAddPasskeyFlowStore.setState({ state: 'entry' });
  CashDepositSetupNavigation.resetNavigationState();
  useNavigationStore.getState().setActiveRoute(Routes.CASH_DEPOSIT_SETUP_SCREEN);
});

afterEach(() => {
  jest.restoreAllMocks();
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
    const expiresAt = Date.now() + 60_000;
    verifyPhone(expiresAt);
    jest.spyOn(Date, 'now').mockReturnValue(expiresAt + 1);
    expect(session().status).toBe('phoneVerified');

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
    { case: 'live submission rejects', arrange: () => useSubmitReviewFlowStore.setState({ state: 'rejected' }) },
    { case: 'resume OTP rejects', arrange: () => useVerifyPhoneFlowStore.setState({ kycOutcome: 'rejected' }) },
    { case: 'return check finds an unsupported state', arrange: () => useKycReturnFlowStore.setState({ state: 'unsupportedState' }) },
  ])('drops the session when the $case', ({ arrange }) => {
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

  it('keeps the session while KYC is still reviewing', () => {
    verifyPhone();
    useKycReturnFlowStore.setState({ state: 'reviewing' });

    endSetupSession();

    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: 'bst_1' });
  });

  it('keeps an approved session until passkey enrollment completes', () => {
    verifyPhone();
    useSubmitReviewFlowStore.setState({ state: 'approved' });

    endSetupSession();

    expect(session()).toMatchObject({ status: 'phoneVerified', bootstrapToken: 'bst_1' });
  });

  it('drops anything short of a verified phone', () => {
    useCashSetupSessionStore.getState().setPhoneSubmitted({ challenge: CHALLENGE, phoneNationalNumber: '4155550100', resendAfter: 0 });

    endSetupSession();

    expect(session()).toEqual({ status: 'empty' });
  });
});

describe('restartSetupWithoutCredential', () => {
  function staleFlows() {
    useVerifyPhoneFlowStore.setState({ kycOutcome: 'reviewing' });
    useSubmitReviewFlowStore.setState({ state: 'submitting' });
    useKycReturnFlowStore.setState({ state: 'rejected' });
    useAddPasskeyFlowStore.setState({ state: 'error' });
  }

  it('restarts an active Setup at Phone and clears the stale flows once the session clears', () => {
    verifyPhone();
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_IDENTITY);
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_SSN);
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_REVIEW);
    staleFlows();

    useCashSetupSessionStore.getState().reset();
    restartSetupWithoutCredential();

    expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_PHONE);
    expect(useKycReturnFlowStore.getState().state).toBe('idle');
    expect(useVerifyPhoneFlowStore.getState().kycOutcome).toBeNull();
    expect(useSubmitReviewFlowStore.getState().state).toBe('entry');
    expect(useAddPasskeyFlowStore.getState().state).toBe('entry');
  });

  it('resets a covered Setup without navigating it', () => {
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_REVIEW);
    useNavigationStore.getState().setActiveRoute(Routes.ADD_CASH_SHEET);

    useCashSetupSessionStore.getState().reset();
    restartSetupWithoutCredential();

    expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_PHONE);
    expect(useNavigationStore.getState().activeRoute).toBe(Routes.ADD_CASH_SHEET);
  });

  it('leaves a live session alone when passkey enrollment settles', () => {
    verifyPhone();
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_PASSKEY);

    restartSetupWithoutCredential();

    expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_PASSKEY);
  });

  it('waits for passkey enrollment to settle', () => {
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_REVIEW);
    useAddPasskeyFlowStore.setState({ state: 'submitting' });

    useCashSetupSessionStore.getState().reset();
    restartSetupWithoutCredential();

    expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_REVIEW);
  });

  it('leaves an enrolled account alone', () => {
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_REVIEW);
    useCashAccountStore.getState().setUserId('user-1');
    staleFlows();

    useCashSetupSessionStore.getState().reset();
    restartSetupWithoutCredential();

    expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_REVIEW);
    expect(useSubmitReviewFlowStore.getState().state).toBe('submitting');
  });

  it('does nothing when Setup is already at Phone', () => {
    staleFlows();

    useCashSetupSessionStore.getState().reset();
    restartSetupWithoutCredential();

    expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_PHONE);
    expect(useSubmitReviewFlowStore.getState().state).toBe('submitting');
  });
});
