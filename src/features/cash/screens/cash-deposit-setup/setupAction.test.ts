import { createBaseStore } from '@storesjs/stores';

import Routes from '@/navigation/routesNames';

import { useCashSetupSessionStore } from '../../stores/cashSetupSessionStore';
import { useKycReturnFlowStore } from '../../stores/kycReturnFlowStore';
import { CashDepositSetupNavigation, useCashDepositSetupNavigationStore } from './cashDepositSetupNavigator';
import { checkKycOnReturn, createSetupActionStore } from './setupAction';
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

jest.mock('./steps/useSubmitReviewFlow', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return { useSubmitReviewFlowStore: createBaseStore(() => ({ state: 'entry' })) };
});

jest.mock('../../stores/kycReturnFlowStore', () => {
  const { createBaseStore } = jest.requireActual<typeof import('@storesjs/stores')>('@storesjs/stores');
  return { useKycReturnFlowStore: createBaseStore(() => ({ state: 'idle', check: jest.fn(), reset: jest.fn() })) };
});

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

describe('checkKycOnReturn', () => {
  const mockCheck = jest.mocked(useKycReturnFlowStore.getState().check);

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
});
