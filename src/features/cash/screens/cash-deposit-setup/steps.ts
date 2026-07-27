import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { isCashDepositSetupComplete, type CashDepositSetupStatus } from '../../stores/deriveCashDepositSetupStatus';

/** The Setup flow order; reorder by editing this array. */
export const SETUP_STEP_ORDER: readonly CashDepositSetupRoute[] = [
  Routes.CASH_SETUP_PHONE,
  Routes.CASH_SETUP_CONFIRM_PHONE,
  Routes.CASH_SETUP_IDENTITY,
  Routes.CASH_SETUP_SSN,
  Routes.CASH_SETUP_REVIEW,
  Routes.CASH_SETUP_PASSKEY,
  Routes.CASH_SETUP_EMAIL,
  Routes.CASH_SETUP_ALL_DONE,
  Routes.CASH_SETUP_CARD_DETAILS,
  Routes.CASH_SETUP_CARD_ADDED,
];

export function getNextSetupStep(current: CashDepositSetupRoute): CashDepositSetupRoute | null {
  const index = SETUP_STEP_ORDER.indexOf(current);
  return SETUP_STEP_ORDER[index + 1] ?? null;
}

const SETUP_STEP_FOR_STATUS: Record<Exclude<CashDepositSetupStatus, 'ready'>, CashDepositSetupRoute> = {
  needsIdentity: Routes.CASH_SETUP_PHONE,
  needsCard: Routes.CASH_SETUP_CARD_DETAILS,
};

export function getFirstSetupStep(status: CashDepositSetupStatus): CashDepositSetupRoute | undefined {
  if (isCashDepositSetupComplete(status)) return;
  return SETUP_STEP_FOR_STATUS[status];
}
