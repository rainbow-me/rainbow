import { useCashDepositSetupStatusStore, useCashDepositSetupStore } from './cashDepositSetupStore';
import { useCashPaymentMethodStore, type LinkedCard } from './cashPaymentMethodStore';
import { EMPTY_CASH_DEPOSIT_SETUP_FACTS, type CashDepositSetupFacts, type CashDepositSetupStatus } from './deriveCashDepositSetupStatus';

const IDENTITY_DONE: CashDepositSetupFacts = {
  phoneVerified: true,
  kycPassed: true,
  passkeyRegistered: true,
  hasLinkedWallet: false,
};
const A_CARD: LinkedCard = { id: 'card-1', brand: 'Visa', last4: '4242' };

type Case = {
  name: string;
  facts: CashDepositSetupFacts;
  linkedCard: LinkedCard | null;
  expected: CashDepositSetupStatus;
};

const cases: Case[] = [
  {
    name: 'identity incomplete → needsIdentity',
    facts: EMPTY_CASH_DEPOSIT_SETUP_FACTS,
    linkedCard: null,
    expected: 'needsIdentity',
  },
  {
    name: 'identity done, no card → needsCard',
    facts: IDENTITY_DONE,
    linkedCard: null,
    expected: 'needsCard',
  },
  {
    name: 'identity done, real card linked → needsWallet',
    facts: IDENTITY_DONE,
    linkedCard: A_CARD,
    expected: 'needsWallet',
  },
  {
    name: 'everything done, real card linked → ready',
    facts: { ...IDENTITY_DONE, hasLinkedWallet: true },
    linkedCard: A_CARD,
    expected: 'ready',
  },
];

describe('useCashDepositSetupStatusStore', () => {
  beforeEach(() => {
    useCashDepositSetupStore.setState({ facts: EMPTY_CASH_DEPOSIT_SETUP_FACTS });
    useCashPaymentMethodStore.setState({ linkedCard: null });
  });

  it.each(cases)('$name', ({ facts, linkedCard, expected }) => {
    useCashDepositSetupStore.setState({ facts });
    useCashPaymentMethodStore.setState({ linkedCard });
    expect(useCashDepositSetupStatusStore.getState()).toBe(expected);
  });
});
