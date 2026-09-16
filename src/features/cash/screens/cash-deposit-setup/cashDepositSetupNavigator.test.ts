import Routes from '@/navigation/routesNames';

import { useCashAccountStore } from '../../stores/cashAccountStore';
import { useCashPaymentMethodStore } from '../../stores/cashPaymentMethodStore';
import { useCashSetupSessionStore, type PhoneVerificationChallenge } from '../../stores/cashSetupSessionStore';
import { CashDepositSetupNavigation, CashDepositSetupNavigator } from './cashDepositSetupNavigator';

const CHALLENGE: PhoneVerificationChallenge = { kind: 'signup', userId: 'user-1' };

function verifyPhone({ complete, expiresAt = Date.now() + 60_000 }: { complete: boolean; expiresAt?: number }) {
  const store = useCashSetupSessionStore.getState();
  store.setPhoneSubmitted({ challenge: CHALLENGE, phoneNationalNumber: '4155550100', resendAfter: 0 });
  store.setPhoneVerified(CHALLENGE, { bootstrapToken: 'bst_1', expiresAt });
  if (!complete) return;
  store.setFirstName('Ada');
  store.setLastName('Lovelace');
  store.setDateOfBirth({ year: 1990, month: 1, day: 2 });
  store.setSsnLast4('1234');
}

function open() {
  CashDepositSetupNavigator.Pager.beginPath?.();
  return CashDepositSetupNavigation.getActiveRoute();
}

beforeEach(() => {
  useCashAccountStore.getState().clearUserId();
  useCashPaymentMethodStore.getState().clear();
  useCashSetupSessionStore.getState().reset();
  CashDepositSetupNavigation.resetNavigationState();
});

describe('CashDepositSetupNavigator entry route', () => {
  it('starts at Phone without a verified phone', () => {
    expect(open()).toBe(Routes.CASH_SETUP_PHONE);
  });

  it('skips phone + OTP into Identity while a bootstrap token is live', () => {
    verifyPhone({ complete: false });
    expect(open()).toBe(Routes.CASH_SETUP_IDENTITY);
  });

  it('skips straight to Review when the retained draft is complete', () => {
    verifyPhone({ complete: true });
    expect(open()).toBe(Routes.CASH_SETUP_REVIEW);
  });

  it('starts at Phone once the retained token has expired', () => {
    verifyPhone({ complete: true, expiresAt: Date.now() - 1 });
    expect(open()).toBe(Routes.CASH_SETUP_PHONE);
  });

  it('starts at Card Details for an account holder regardless of the session', () => {
    verifyPhone({ complete: true });
    useCashAccountStore.getState().setUserId('user-1');
    expect(open()).toBe(Routes.CASH_SETUP_CARD_DETAILS);
  });
});
