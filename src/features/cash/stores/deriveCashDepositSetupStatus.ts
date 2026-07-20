export type CashDepositSetupStatus = 'needsIdentity' | 'needsCard' | 'needsWallet' | 'ready';

export type CashDepositSetupFacts = {
  kycPassed: boolean;
  passkeyRegistered: boolean;
  hasLinkedWallet: boolean;
};

export const EMPTY_CASH_DEPOSIT_SETUP_FACTS: CashDepositSetupFacts = {
  kycPassed: false,
  passkeyRegistered: false,
  hasLinkedWallet: false,
};

export function deriveCashDepositSetupStatus(
  inputs: CashDepositSetupFacts & { phoneVerified: boolean; hasLinkedCard: boolean }
): CashDepositSetupStatus {
  const identityComplete = inputs.phoneVerified && inputs.kycPassed && inputs.passkeyRegistered;
  if (!identityComplete) return 'needsIdentity';
  if (!inputs.hasLinkedCard) return 'needsCard';
  if (!inputs.hasLinkedWallet) return 'needsWallet';
  return 'ready';
}

export function isCashDepositSetupComplete(status: CashDepositSetupStatus): status is 'ready' {
  return status === 'ready';
}

export function isCashDepositSetupFactKey(key: string): key is keyof CashDepositSetupFacts {
  return key in EMPTY_CASH_DEPOSIT_SETUP_FACTS;
}
