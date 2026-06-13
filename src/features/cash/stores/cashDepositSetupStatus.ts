/**
 * The member's progress through Cash Setup, in canonical order. Anything short of `ready`
 * keeps them on the Setup flow; `ready` lets the entry point open Add Cash directly.
 *
 * This array is the single source of truth: `CashDepositSetupStatus` is derived from it, and the
 * dev select renders it in order.
 *
 * Stubbed for now: the real status derives from JWT claims + ramp GETs once auth lands.
 * Until then it is a mock driven from Developer Settings.
 */
export const CASH_DEPOSIT_SETUP_STATUSES = ['needsIdentity', 'needsCard', 'needsWallet', 'ready'] as const;

export type CashDepositSetupStatus = (typeof CASH_DEPOSIT_SETUP_STATUSES)[number];

export function isCashDepositSetupComplete(status: CashDepositSetupStatus): boolean {
  return status === 'ready';
}

export function isCashDepositSetupStatus(status: string): status is CashDepositSetupStatus {
  return CASH_DEPOSIT_SETUP_STATUSES.some(s => s === status);
}
