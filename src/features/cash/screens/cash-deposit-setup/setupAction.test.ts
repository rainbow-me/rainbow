import { createBaseStore } from '@storesjs/stores';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import Routes from '@/navigation/routesNames';

import { signInWithPhone } from '../../services/cashSignInService';
import { useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { useKycReturnFlowStore } from '../../stores/kycReturnFlowStore';
import { CashDepositSetupNavigation, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { checkKycOnReturn, createSetupActionStore, signInToExistingAccount } from './setupAction';
import { completeSetup, completeSetupStep } from './setupNavigation';
import { useSubmitPhoneFlowStore } from './steps/useSubmitPhoneFlow';
import { useSubmitReviewFlowStore } from './steps/useSubmitReviewFlow';

vi.mock('../../services/cashSignInService', () => ({
  signInWithPhone: vi.fn(),
}));

vi.mock('./setupNavigation', () => ({
  completeSetup: vi.fn(),
  completeSetupStep: vi.fn(),
  goBackInSetup: vi.fn(),
}));

vi.mock('../../stores/cardLinkFlowStore', () => ({
  useCardLinkFlowStore: {},
}));

vi.mock('./steps/useAddPasskeyFlow', () => ({
  useAddPasskeyFlowStore: {},
}));

vi.mock('./steps/useSubmitReviewFlow', async () => {
  const { createBaseStore } = await vi.importActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return { useSubmitReviewFlowStore: createBaseStore(() => ({ state: 'entry', kycSubmitted: false })) };
});

vi.mock('../../stores/kycReturnFlowStore', async () => {
  const { createBaseStore } = await vi.importActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return { useKycReturnFlowStore: createBaseStore(() => ({ state: 'idle', check: vi.fn(), reset: vi.fn() })) };
});

const DIGITS = '4155550100';
const mockCompleteSetupStep = completeSetupStep as Mock;

const useActionStore = createSetupActionStore(
  vi.fn() as never,
  createBaseStore(() => ({ isReady: false }))
);

beforeEach(() => {
  vi.clearAllMocks();
  useSubmitReviewFlowStore.setState({ kycSubmitted: false });
  CashDepositSetupNavigation.resetNavigationState();
  useCashSetupSessionStore.getState().reset();
  useSubmitPhoneFlowStore.setState({ state: 'entry', digits: DIGITS });
  mockCompleteSetupStep.mockImplementation(() => CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_CONFIRM_PHONE));
});

it('advances only once when a pending-code re-entry is submitted twice', async () => {
  useCashSetupSessionStore.getState().setPhoneSubmitted({
    challenge: { kind: 'signup', userId: 'user-1' },
    phoneNationalNumber: DIGITS,
    resendAfter: 1_750_000_030_000,
  });
  const { onPress } = useActionStore.getState();

  await Promise.all([onPress(), onPress()]);

  expect(mockCompleteSetupStep).toHaveBeenCalledTimes(1);
  expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_CONFIRM_PHONE);
});

it('does not start sign-in outside the phone step', async () => {
  useSubmitPhoneFlowStore.setState({ state: 'existingAccount' });
  CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_CONFIRM_PHONE);

  await signInToExistingAccount();

  expect(signInWithPhone).not.toHaveBeenCalled();
  expect(completeSetup).not.toHaveBeenCalled();
});

it.each([
  { step: Routes.CASH_SETUP_PHONE, expectedCompletions: 1 },
  { step: Routes.CASH_SETUP_CONFIRM_PHONE, expectedCompletions: 0 },
])('completes sign-in $expectedCompletions times when it resolves on $step', async ({ step, expectedCompletions }) => {
  let resolveSignIn!: () => void;
  vi.mocked(signInWithPhone).mockReturnValue(
    new Promise<void>(resolve => {
      resolveSignIn = resolve;
    })
  );
  useSubmitPhoneFlowStore.setState({ state: 'existingAccount' });

  const pending = signInToExistingAccount();
  expect(completeSetup).not.toHaveBeenCalled();

  CashDepositSetupNavigation.navigate(step);
  resolveSignIn();
  await pending;

  expect(completeSetup).toHaveBeenCalledTimes(expectedCompletions);
});

describe('checkKycOnReturn', () => {
  const mockCheck = vi.mocked(useKycReturnFlowStore.getState().check);

  beforeEach(() => {
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_IDENTITY);
  });

  it('falls back to the Phone step when the mounted return check reports expiry', async () => {
    const result = 'expired';
    mockCheck.mockResolvedValue(result);

    await expect(checkKycOnReturn(() => true)).resolves.toBe(result);

    expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_PHONE);
    expect(useCashDepositSetupNavigationStore.getState().history).toEqual([]);
  });

  it('does not navigate when expiry lands after the return-check caller unmounts', async () => {
    mockCheck.mockResolvedValue('expired');

    await expect(checkKycOnReturn(() => false)).resolves.toBe('expired');

    expect(CashDepositSetupNavigation.getActiveRoute()).toBe(Routes.CASH_SETUP_IDENTITY);
  });
});

describe('Review action while the return check runs', () => {
  beforeEach(() => {
    const challenge = { kind: 'signup', userId: 'user-1' } as const;
    const session = useCashSetupSessionStore.getState();
    session.setPhoneSubmitted({ challenge, phoneNationalNumber: DIGITS, resendAfter: 0 });
    session.setPhoneVerified(challenge, { bootstrapToken: 'bst_1', expiresAt: Date.now() + 60_000 });
    session.setFirstName('Ada');
    session.setLastName('Lovelace');
    session.setDateOfBirth({ year: 1990, month: 1, day: 2 });
    session.setSsnLast4('1234');
    CashDepositSetupNavigation.navigate(Routes.CASH_SETUP_REVIEW);
  });

  afterEach(() => {
    useKycReturnFlowStore.setState({ state: 'idle' });
  });

  it('holds Confirm without a spinner until the check settles', () => {
    useKycReturnFlowStore.setState({ state: 'checking' });

    expect(useActionStore.getState()).toMatchObject({ disabled: true, loading: false });
    useKycReturnFlowStore.setState({ state: 'idle' });

    expect(useActionStore.getState()).toMatchObject({ disabled: false, loading: false });
  });

  it('enables a status-only retry after KYC was submitted in the current flow', () => {
    const session = useCashSetupSessionStore.getState();
    session.markKycSubmitted('bst_1');

    expect(useActionStore.getState()).toMatchObject({ disabled: true });

    useSubmitReviewFlowStore.setState({ kycSubmitted: true });

    expect(useActionStore.getState()).toMatchObject({ disabled: false });
  });
});
