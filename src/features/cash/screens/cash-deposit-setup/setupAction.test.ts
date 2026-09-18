import { createBaseStore } from '@storesjs/stores';

import Routes from '@/navigation/routesNames';

import { signInWithPhone } from '../../services/cashSignInService';
import { useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { CashDepositSetupNavigation } from './cashDepositSetupNavigator';
import { createSetupActionStore, signInToExistingAccount } from './setupAction';
import { completeSetup, completeSetupStep } from './setupNavigation';
import { useSubmitPhoneFlowStore } from './steps/useSubmitPhoneFlow';

jest.mock('../../services/cashSignInService', () => ({
  signInWithPhone: jest.fn(),
}));

jest.mock('./setupNavigation', () => ({
  completeSetup: jest.fn(),
  completeSetupStep: jest.fn(),
  goBackInSetup: jest.fn(),
}));

jest.mock('../../stores/cardLinkFlowStore', () => ({
  useCardLinkFlowStore: {},
}));

jest.mock('./steps/useAddPasskeyFlow', () => ({
  useAddPasskeyFlowStore: {},
}));

jest.mock('./steps/useSubmitReviewFlow', () => ({
  useSubmitReviewFlowStore: {},
}));

const DIGITS = '4155550100';
const mockCompleteSetupStep = completeSetupStep as jest.Mock;

const useActionStore = createSetupActionStore(
  jest.fn() as never,
  createBaseStore(() => ({ isReady: false }))
);

beforeEach(() => {
  jest.clearAllMocks();
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
  jest.mocked(signInWithPhone).mockReturnValue(
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
