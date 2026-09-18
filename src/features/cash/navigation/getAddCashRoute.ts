import Routes from '@/navigation/routesNames';

import { type CashDepositSetupStatus } from '../stores/deriveCashDepositSetupStatus';

type AddCashRoute =
  | typeof Routes.ADD_CASH_SHEET
  | typeof Routes.CASH_DEPOSIT_INTRO_PANEL
  | typeof Routes.CASH_DEPOSIT_SETUP_SCREEN
  | typeof Routes.FIAT_ON_RAMP_SHEET;

/**
 * Where the Add Cash entry point lands. Cash off keeps today's behavior; once it's on,
 * an account holder goes straight to Add Cash (even without a linked card — the sheet
 * offers to add one), a member mid-signup whose phone verification is still live goes
 * straight back into Setup, and anyone else without an account lands on the intro panel.
 */
export function getAddCashRoute(isCashEnabled: boolean, setupStatus: CashDepositSetupStatus, isPhoneVerified: boolean): AddCashRoute {
  if (!isCashEnabled) return Routes.FIAT_ON_RAMP_SHEET;
  return setupStatus === 'needsIdentity'
    ? isPhoneVerified
      ? Routes.CASH_DEPOSIT_SETUP_SCREEN
      : Routes.CASH_DEPOSIT_INTRO_PANEL
    : Routes.ADD_CASH_SHEET;
}
