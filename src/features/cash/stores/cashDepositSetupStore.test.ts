import { useCashDepositSetupStatusStore, useCashDepositSetupStore } from './cashDepositSetupStore';
import { useCashPaymentMethodStore, type LinkedCard } from './cashPaymentMethodStore';
import { useCashSetupSessionStore } from './cashSetupSessionStore';
import { EMPTY_CASH_DEPOSIT_SETUP_FACTS, type CashDepositSetupFacts, type CashDepositSetupStatus } from './deriveCashDepositSetupStatus';

const IDENTITY_DONE: CashDepositSetupFacts = {
  kycPassed: true,
  passkeyRegistered: true,
  hasLinkedWallet: false,
};
const A_CARD: LinkedCard = { id: 'card-1', brand: 'Visa', last4: '4242' };

const verifiedSession = (tokenExpiresAt: number) =>
  ({
    status: 'phoneVerified',
    userId: 'user-1',
    phoneNationalNumber: '4155550100',
    bootstrapToken: 'bst_test',
    bootstrapTokenExpiresAt: tokenExpiresAt,
    identity: null,
    governmentId: null,
  }) as const;

type Case = {
  name: string;
  facts: CashDepositSetupFacts;
  tokenExpiresAt: number | null;
  linkedCard: LinkedCard | null;
  expected: CashDepositSetupStatus;
};

const cases: Case[] = [
  {
    name: 'identity incomplete → needsIdentity',
    facts: EMPTY_CASH_DEPOSIT_SETUP_FACTS,
    tokenExpiresAt: null,
    linkedCard: null,
    expected: 'needsIdentity',
  },
  {
    name: 'facts done but no bootstrap token → needsIdentity',
    facts: IDENTITY_DONE,
    tokenExpiresAt: null,
    linkedCard: A_CARD,
    expected: 'needsIdentity',
  },
  {
    name: 'facts done but expired bootstrap token → needsIdentity',
    facts: IDENTITY_DONE,
    tokenExpiresAt: Date.now() - 1,
    linkedCard: A_CARD,
    expected: 'needsIdentity',
  },
  {
    name: 'identity done, no card → needsCard',
    facts: IDENTITY_DONE,
    tokenExpiresAt: Date.now() + 60_000,
    linkedCard: null,
    expected: 'needsCard',
  },
  {
    name: 'identity done, real card linked → needsWallet',
    facts: IDENTITY_DONE,
    tokenExpiresAt: Date.now() + 60_000,
    linkedCard: A_CARD,
    expected: 'needsWallet',
  },
  {
    name: 'everything done, real card linked → ready',
    facts: { ...IDENTITY_DONE, hasLinkedWallet: true },
    tokenExpiresAt: Date.now() + 60_000,
    linkedCard: A_CARD,
    expected: 'ready',
  },
];

describe('useCashDepositSetupStatusStore', () => {
  beforeEach(() => {
    useCashDepositSetupStore.setState({ facts: EMPTY_CASH_DEPOSIT_SETUP_FACTS });
    useCashSetupSessionStore.getState().reset();
    useCashPaymentMethodStore.setState({ linkedCard: null });
  });

  it.each(cases)('$name', ({ facts, tokenExpiresAt, linkedCard, expected }) => {
    useCashDepositSetupStore.setState({ facts });
    if (tokenExpiresAt != null) {
      useCashSetupSessionStore.setState({ session: verifiedSession(tokenExpiresAt) });
    }
    useCashPaymentMethodStore.setState({ linkedCard });
    expect(useCashDepositSetupStatusStore.getState()).toBe(expected);
  });

  it('regresses from ready to needsIdentity when the session store resets', () => {
    useCashDepositSetupStore.setState({ facts: { ...IDENTITY_DONE, hasLinkedWallet: true } });
    useCashSetupSessionStore.setState({ session: verifiedSession(Date.now() + 60_000) });
    useCashPaymentMethodStore.setState({ linkedCard: A_CARD });
    expect(useCashDepositSetupStatusStore.getState()).toBe('ready');

    useCashSetupSessionStore.getState().reset();
    expect(useCashDepositSetupStatusStore.getState()).toBe('needsIdentity');
  });
});
