import Routes from '@/navigation/routesNames';

type AddCashRoute = typeof Routes.CASH_DEPOSIT_INTRO_PANEL | typeof Routes.FIAT_ON_RAMP_SHEET;

export function getAddCashRoute(isCashEnabled: boolean): AddCashRoute {
  return isCashEnabled ? Routes.CASH_DEPOSIT_INTRO_PANEL : Routes.FIAT_ON_RAMP_SHEET;
}
