import { deriveCashDepositSetupStatus, EMPTY_CASH_DEPOSIT_SETUP_FACTS, type CashDepositSetupFacts } from './deriveCashDepositSetupStatus';

const facts = (overrides: Partial<CashDepositSetupFacts>): CashDepositSetupFacts => ({
  ...EMPTY_CASH_DEPOSIT_SETUP_FACTS,
  ...overrides,
});

describe('deriveCashDepositSetupStatus', () => {
  it('is needsIdentity when the identity half is incomplete', () => {
    expect(deriveCashDepositSetupStatus(EMPTY_CASH_DEPOSIT_SETUP_FACTS, false)).toBe('needsIdentity');
    expect(deriveCashDepositSetupStatus(facts({ phoneVerified: true, kycPassed: true }), false)).toBe('needsIdentity');
  });

  it('is needsCard once identity is complete but no card is linked', () => {
    expect(deriveCashDepositSetupStatus(facts({ phoneVerified: true, kycPassed: true, passkeyRegistered: true }), false)).toBe('needsCard');
  });

  it('is needsWallet once a card is linked but no wallet is', () => {
    expect(deriveCashDepositSetupStatus(facts({ phoneVerified: true, kycPassed: true, passkeyRegistered: true }), true)).toBe(
      'needsWallet'
    );
  });

  it('is ready when every fact is satisfied', () => {
    expect(
      deriveCashDepositSetupStatus({ phoneVerified: true, kycPassed: true, passkeyRegistered: true, hasLinkedWallet: true }, true)
    ).toBe('ready');
  });
});
