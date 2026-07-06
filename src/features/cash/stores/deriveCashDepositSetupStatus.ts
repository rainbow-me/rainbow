export type CashDepositSetupStatus = 'needsIdentity' | 'needsCard' | 'needsWallet' | 'ready';

export type CashDepositSetupFacts = {
  phoneVerified: boolean;
  kycPassed: boolean;
  passkeyRegistered: boolean;
  hasLinkedWallet: boolean;
};

export const EMPTY_CASH_DEPOSIT_SETUP_FACTS: CashDepositSetupFacts = {
  phoneVerified: false,
  kycPassed: false,
  passkeyRegistered: false,
  hasLinkedWallet: false,
};

export function deriveCashDepositSetupStatus(facts: CashDepositSetupFacts, hasLinkedCard: boolean): CashDepositSetupStatus {
  const identityComplete = facts.phoneVerified && facts.kycPassed && facts.passkeyRegistered;
  if (!identityComplete) return 'needsIdentity';
  if (!hasLinkedCard) return 'needsCard';
  if (!facts.hasLinkedWallet) return 'needsWallet';
  return 'ready';
}

export function isCashDepositSetupComplete(status: CashDepositSetupStatus): status is 'ready' {
  return status === 'ready';
}

export function isCashDepositSetupFactKey(key: string): key is keyof CashDepositSetupFacts {
  return key in EMPTY_CASH_DEPOSIT_SETUP_FACTS;
}
