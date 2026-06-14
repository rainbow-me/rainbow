import { isCashDepositSetupComplete } from './cashDepositSetupStatus';

describe('isCashDepositSetupComplete', () => {
  it('is complete only when the member is ready to add cash', () => {
    expect(isCashDepositSetupComplete('ready')).toBe(true);
  });

  it('is not complete while any setup gate remains', () => {
    expect(isCashDepositSetupComplete('needsIdentity')).toBe(false);
    expect(isCashDepositSetupComplete('needsCard')).toBe(false);
    expect(isCashDepositSetupComplete('needsWallet')).toBe(false);
  });
});
