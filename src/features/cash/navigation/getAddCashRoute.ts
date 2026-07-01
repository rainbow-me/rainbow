import Routes from '@/navigation/routesNames';

import { isCashDepositSetupComplete, type CashDepositSetupStatus } from '../stores/deriveCashDepositSetupStatus';

type AddCashRoute = typeof Routes.ADD_CASH_SHEET | typeof Routes.CASH_DEPOSIT_INTRO_PANEL | typeof Routes.FIAT_ON_RAMP_SHEET;

/**
 * Where the Add Cash entry point lands. Cash off keeps today's behavior; once it's on,
 * a ready member skips the intro panel and goes straight to Add Cash, while a member
 * who still has setup gates lands on the intro panel.
 */
export function getAddCashRoute(isCashEnabled: boolean, setupStatus: CashDepositSetupStatus): AddCashRoute {
  if (!isCashEnabled) return Routes.FIAT_ON_RAMP_SHEET;
  return isCashDepositSetupComplete(setupStatus) ? Routes.ADD_CASH_SHEET : Routes.CASH_DEPOSIT_INTRO_PANEL;
}
