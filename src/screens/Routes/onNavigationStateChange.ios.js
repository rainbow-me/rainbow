import analytics from '@segment/analytics-react-native';
import { get } from 'lodash';
import { StatusBar } from 'react-native';
import { NavigationActions } from 'react-navigation';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { Navigation } from '../../navigation';
import { expandedPreset } from '../../navigation/transitions/effects';
import { sentryUtils } from '../../utils';
import ROUTES from './routesNames';

const routesForNativeStackFallback = {
  [ROUTES.ADD_CASH_SHEET]: true,
  [ROUTES.IMPORT_SEED_PHRASE_SHEET]: true,
  [ROUTES.MAIN_NAVIGATOR]: true,
  [ROUTES.OVERLAY_EXPANDED_ASSET_SCREEN]: true,
  [ROUTES.OVERLAY_EXPANDED_SUPPORTED_COUNTRIES]: true,
  [ROUTES.SEND_SHEET]: true,
  [ROUTES.MAIN_NATIVE_BOTTOM_SHEET_NAVIGATOR]: true,
  [ROUTES.SAVINGS_DEPOSIT_MODAL]: true,
  [ROUTES.SAVINGS_DEPOSIT_MODAL]: true,
};

export function onNavigationStateChange(prevState, currentState) {
  const { params, routeName } = Navigation.getActiveRoute(currentState);
  const prevRouteName = Navigation.getActiveRouteName(prevState);
  // native stack rn does not support onTransitionEnd and onTransitionStart
  // Set focus manually on route changes

  if (
    prevRouteName !== routeName &&
    isNativeStackAvailable &&
    (routesForNativeStackFallback[prevRouteName] ||
      routesForNativeStackFallback[routeName])
  ) {
    Navigation.handleAction(
      NavigationActions.setParams({
        key: routeName,
        params: { focused: true },
      })
    );

    Navigation.handleAction(
      NavigationActions.setParams({
        key: prevRouteName,
        params: { focused: false },
      })
    );
  }

  const oldBottomSheetStackindex = prevState.index;
  const newBottomSheetStackIndex = currentState.index;

  if (oldBottomSheetStackindex !== newBottomSheetStackIndex) {
    expandedPreset.onTransitionStart({ closing: !newBottomSheetStackIndex });
  }

  if (
    prevRouteName !== ROUTES.QR_SCANNER_SCREEN &&
    routeName === ROUTES.QR_SCANNER_SCREEN
  ) {
    StatusBar.setBarStyle('light-content', true);
  }

  if (
    prevRouteName === ROUTES.QR_SCANNER_SCREEN &&
    routeName !== ROUTES.QR_SCANNER_SCREEN
  ) {
    StatusBar.setBarStyle('dark-content', true);
  }

  if (
    prevRouteName === ROUTES.IMPORT_SEED_PHRASE_SHEET &&
    (routeName === ROUTES.PROFILE_SCREEN || routeName === ROUTES.WALLET_SCREEN)
  ) {
    StatusBar.setBarStyle('dark-content', true);
  }

  if (prevRouteName === ROUTES.WALLET_SCREEN && routeName === 'SendSheet') {
    StatusBar.setBarStyle('light-content', true);
  }

  if (
    prevRouteName === ROUTES.SEND_SHEET &&
    (routeName === ROUTES.PROFILE_SCREEN || routeName === ROUTES.WALLET_SCREEN)
  ) {
    StatusBar.setBarStyle('dark-content', true);
  }

  if (
    prevRouteName === ROUTES.ADD_CASH_SHEET &&
    (routeName === ROUTES.PROFILE_SCREEN || routeName === ROUTES.WALLET_SCREEN)
  ) {
    StatusBar.setBarStyle('dark-content', true);
  }

  if (routeName === 'SettingsModal') {
    let subRoute = get(params, 'section.title');
    if (subRoute === 'Settings') subRoute = null;
    return analytics.screen(`${routeName}${subRoute ? `>${subRoute}` : ''}`);
  }

  if (routeName !== prevRouteName) {
    let paramsToTrack = null;

    if (routeName === ROUTES.EXPANDED_ASSET_SCREEN) {
      const { asset, type } = params;
      paramsToTrack = {
        assetContractAddress:
          asset.address || get(asset, 'asset_contract.address'),
        assetName: asset.name,
        assetSymbol: asset.symbol || get(asset, 'asset_contract.symbol'),
        assetType: type,
      };
    }
    sentryUtils.addNavBreadcrumb(prevRouteName, routeName, paramsToTrack);
    return analytics.screen(routeName, paramsToTrack);
  }
}
