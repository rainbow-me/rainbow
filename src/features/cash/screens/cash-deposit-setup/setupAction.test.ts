import { createBaseStore } from '@storesjs/stores';

import Routes from '@/navigation/routesNames';

import { useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { CashDepositSetupNavigation } from './cashDepositSetupNavigator';
import { createSetupActionStore } from './setupAction';
import { completeSetupStep } from './setupNavigation';
import { useSubmitPhoneFlowStore } from './steps/useSubmitPhoneFlow';

jest.mock('./setupNavigation', () => ({
  completeSetupStep: jest.fn(),
  goBackInSetup: jest.fn(),
}));

jest.mock('../../stores/cardLinkFlowStore', () => ({
  useCardLinkFlowStore: {},
}));

jest.mock('./steps/useAddPasskeyFlow', () => ({
  useAddPasskeyFlowStore: {},
}));

jest.mock('./steps/useSubmitKycFlow', () => ({
  useSubmitKycFlowStore: {},
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
