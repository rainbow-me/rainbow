import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import {
  deriveCashDepositSetupStatus,
  isCashDepositSetupComplete,
  type CashDepositSetupFacts,
  type CashDepositSetupStatus,
} from '../../stores/deriveCashDepositSetupStatus';

export type CashDepositSetupStep = {
  id: CashDepositSetupRoute;
  /** Fact this step is responsible for. */
  milestone?: keyof CashDepositSetupFacts;
};

/** The Setup flow order and each step's milestone fact; reorder by editing this array. */
export const SETUP_STEP_ORDER: readonly CashDepositSetupStep[] = [
  { id: Routes.CASH_SETUP_PHONE },
  { id: Routes.CASH_SETUP_CONFIRM_PHONE, milestone: 'phoneVerified' },
  { id: Routes.CASH_SETUP_IDENTITY },
  { id: Routes.CASH_SETUP_SSN },
  { id: Routes.CASH_SETUP_REVIEW, milestone: 'kycPassed' },
  { id: Routes.CASH_SETUP_PASSKEY, milestone: 'passkeyRegistered' },
  { id: Routes.CASH_SETUP_EMAIL },
  { id: Routes.CASH_SETUP_ALL_DONE },
  { id: Routes.CASH_SETUP_CARD_DETAILS, milestone: 'hasLinkedCard' },
];

export function getSetupStep(current: CashDepositSetupRoute): CashDepositSetupStep | undefined {
  return SETUP_STEP_ORDER.find(step => step.id === current);
}

export function getNextSetupStep(current: CashDepositSetupRoute): CashDepositSetupRoute | null {
  const index = SETUP_STEP_ORDER.findIndex(step => step.id === current);
  const next = SETUP_STEP_ORDER[index + 1];
  return next ? next.id : null;
}

const SETUP_STEP_FOR_STATUS: Record<Exclude<CashDepositSetupStatus, 'ready'>, CashDepositSetupRoute> = {
  needsIdentity: Routes.CASH_SETUP_PHONE,
  needsCard: Routes.CASH_SETUP_CARD_DETAILS,
  needsWallet: Routes.CASH_SETUP_CARD_DETAILS,
};

export function getFirstSetupStep(facts: CashDepositSetupFacts): CashDepositSetupRoute | undefined {
  const status = deriveCashDepositSetupStatus(facts);
  if (isCashDepositSetupComplete(status)) return;
  return SETUP_STEP_FOR_STATUS[status];
}
