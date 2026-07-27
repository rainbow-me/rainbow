export type CashDepositSetupStatus = 'needsIdentity' | 'needsCard' | 'ready';

export function deriveCashDepositSetupStatus(inputs: { hasAccount: boolean; hasLinkedCard: boolean }): CashDepositSetupStatus {
  if (!inputs.hasAccount) return 'needsIdentity';
  if (!inputs.hasLinkedCard) return 'needsCard';
  return 'ready';
}

export function isCashDepositSetupComplete(status: CashDepositSetupStatus): status is 'ready' {
  return status === 'ready';
}
