import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { device } from '@/storage';

import { usePolymarketProxyAddress } from '../stores/derived/usePolymarketProxyAddress';
import { usePolymarketBalanceStore } from '../stores/polymarketBalanceStore';

export function navigateToPolymarket(params?: RootStackParamList[typeof Routes.POLYMARKET_NAVIGATOR]) {
  navigateWithCollateralConversionIfNeeded(() => navigateToPolymarketSection(params));
}

export function navigateToPolymarketEvent(params: RootStackParamList[typeof Routes.POLYMARKET_EVENT_SCREEN]) {
  navigateWithCollateralConversionIfNeeded(() => Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, params));
}

function navigateWithCollateralConversionIfNeeded(navigate: () => void) {
  const didNavigateToConvert = navigateToPolymarketConvertCollateralIfNeeded(navigate);
  if (!didNavigateToConvert) navigate();
}

function navigateToPolymarketConvertCollateralIfNeeded(onSuccess: () => void): boolean {
  const proxyAddress = usePolymarketProxyAddress.getState();
  if (!proxyAddress) return false;

  const hasUsdcBalance = Number(usePolymarketBalanceStore.getState().getUsdcBalance()) > 0;
  if (!hasUsdcBalance) return false;

  Navigation.handleAction(Routes.POLYMARKET_CONVERT_COLLATERAL_SHEET, {
    onSuccess,
  });
  return true;
}

function navigateToPolymarketSection(params?: RootStackParamList[typeof Routes.POLYMARKET_NAVIGATOR]) {
  const hasSeenExplainSheet = device.get(['hasSeenPolymarketExplainSheet']);

  if (!hasSeenExplainSheet) {
    Navigation.handleAction(Routes.POLYMARKET_EXPLAIN_SHEET, {
      onDismiss: () => {
        device.set(['hasSeenPolymarketExplainSheet'], true);
        Navigation.handleAction(Routes.POLYMARKET_NAVIGATOR, params);
      },
    });
  } else {
    Navigation.handleAction(Routes.POLYMARKET_NAVIGATOR, params);
  }
}
