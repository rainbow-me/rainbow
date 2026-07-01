export type CashDepositSetupStatus = 'needsIdentity' | 'needsCard' | 'needsWallet' | 'ready';

export type CashDepositSetupFacts = {
  phoneVerified: boolean;
  kycPassed: boolean;
  passkeyRegistered: boolean;
  hasLinkedCard: boolean;
  hasLinkedWallet: boolean;
};

export const EMPTY_CASH_DEPOSIT_SETUP_FACTS: CashDepositSetupFacts = {
  phoneVerified: false,
  kycPassed: false,
  passkeyRegistered: false,
  hasLinkedCard: false,
  hasLinkedWallet: false,
};

export function deriveCashDepositSetupStatus(facts: CashDepositSetupFacts): CashDepositSetupStatus {
  const identityComplete = facts.phoneVerified && facts.kycPassed && facts.passkeyRegistered;
  if (!identityComplete) return 'needsIdentity';
  if (!facts.hasLinkedCard) return 'needsCard';
  if (!facts.hasLinkedWallet) return 'needsWallet';
  return 'ready';
}

export function isCashDepositSetupComplete(status: CashDepositSetupStatus): status is 'ready' {
  return status === 'ready';
}

export function isCashDepositSetupFactKey(key: string): key is keyof CashDepositSetupFacts {
  return key in EMPTY_CASH_DEPOSIT_SETUP_FACTS;
}
