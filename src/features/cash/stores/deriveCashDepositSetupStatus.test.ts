import { deriveCashDepositSetupStatus, EMPTY_CASH_DEPOSIT_SETUP_FACTS } from './deriveCashDepositSetupStatus';

const inputs = (overrides: Partial<Parameters<typeof deriveCashDepositSetupStatus>[0]>) => ({
  ...EMPTY_CASH_DEPOSIT_SETUP_FACTS,
  phoneVerified: false,
  hasLinkedCard: false,
  ...overrides,
});

describe('deriveCashDepositSetupStatus', () => {
  it('is needsIdentity when the identity half is incomplete', () => {
    expect(deriveCashDepositSetupStatus(inputs({}))).toBe('needsIdentity');
    expect(deriveCashDepositSetupStatus(inputs({ phoneVerified: true, kycPassed: true }))).toBe('needsIdentity');
  });

  it('is needsIdentity when the phone is not verified, even with every fact true', () => {
    expect(
      deriveCashDepositSetupStatus(inputs({ kycPassed: true, passkeyRegistered: true, hasLinkedWallet: true, hasLinkedCard: true }))
    ).toBe('needsIdentity');
  });

  it('is needsCard once identity is complete but no card is linked', () => {
    expect(deriveCashDepositSetupStatus(inputs({ phoneVerified: true, kycPassed: true, passkeyRegistered: true }))).toBe('needsCard');
  });

  it('is needsWallet once a card is linked but no wallet is', () => {
    expect(
      deriveCashDepositSetupStatus(inputs({ phoneVerified: true, kycPassed: true, passkeyRegistered: true, hasLinkedCard: true }))
    ).toBe('needsWallet');
  });

  it('is ready when every fact is satisfied', () => {
    expect(
      deriveCashDepositSetupStatus(
        inputs({ phoneVerified: true, kycPassed: true, passkeyRegistered: true, hasLinkedCard: true, hasLinkedWallet: true })
      )
    ).toBe('ready');
  });
});
