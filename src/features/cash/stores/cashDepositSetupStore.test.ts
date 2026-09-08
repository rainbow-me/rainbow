import { useCashAccountStore } from './cashAccountStore';
import { useCashDepositSetupStatusStore } from './cashDepositSetupStore';
import { useCashPaymentMethodStore, type LinkedCard } from './cashPaymentMethodStore';

const A_CARD: LinkedCard = { id: 'card-1', brand: 'Visa', last4: '4242' };

describe('useCashDepositSetupStatusStore', () => {
  beforeEach(() => {
    useCashAccountStore.getState().clearUserId();
    useCashPaymentMethodStore.getState().clear();
  });

  it('is needsCard with an account but no card', () => {
    useCashAccountStore.getState().setUserId('user-1');
    expect(useCashDepositSetupStatusStore.getState()).toBe('needsCard');
  });

  it('regresses from ready to needsIdentity when the account record clears', () => {
    useCashAccountStore.getState().setUserId('user-1');
    useCashPaymentMethodStore.getState().addLinkedCard(A_CARD);
    expect(useCashDepositSetupStatusStore.getState()).toBe('ready');

    useCashAccountStore.getState().clearUserId();
    expect(useCashDepositSetupStatusStore.getState()).toBe('needsIdentity');
  });
});
