import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute, type PerpsRoute } from '@/navigation/types';

import { createVirtualNavigator } from './createVirtualNavigator';

jest.mock('@/navigation/RouteContext', () => ({
  UseRouteProvider: ({ children }: { children: unknown }) => children,
}));

jest.mock('@/state/navigation/navigationStore', () => ({
  setActiveRoute: jest.fn(),
}));

const ROUTES: readonly CashDepositSetupRoute[] = [
  Routes.CASH_SETUP_PHONE,
  Routes.CASH_SETUP_CONFIRM_PHONE,
  Routes.CASH_SETUP_IDENTITY,
  Routes.CASH_SETUP_SSN,
];

const GROUPS: Record<string, string> = {
  [Routes.CASH_SETUP_PHONE]: 'a',
  [Routes.CASH_SETUP_CONFIRM_PHONE]: 'a',
  [Routes.CASH_SETUP_IDENTITY]: 'b',
  [Routes.CASH_SETUP_SSN]: 'b',
};

function createNavigator(withGroups: boolean) {
  return createVirtualNavigator<CashDepositSetupRoute>({
    initialRoute: ROUTES[0],
    routes: ROUTES,
    options: withGroups ? { getRouteGroup: route => GROUPS[route] } : undefined,
  });
}

function createPerpsNavigator() {
  return createVirtualNavigator<PerpsRoute>({
    initialRoute: Routes.PERPS_ACCOUNT_SCREEN,
    routes: [Routes.PERPS_ACCOUNT_SCREEN, Routes.PERPS_SEARCH_SCREEN, Routes.PERPS_NEW_POSITION_SCREEN],
  });
}

describe('createVirtualNavigator getRouteGroup', () => {
  it('appends history when navigating within a group', () => {
    const { Navigation, useNavigationStore } = createNavigator(true);
    Navigation.navigate(Routes.CASH_SETUP_CONFIRM_PHONE);
    expect(useNavigationStore.getState().history).toEqual([Routes.CASH_SETUP_PHONE]);
  });

  it('clears history when navigating across a group boundary', () => {
    const { Navigation, useNavigationStore } = createNavigator(true);
    Navigation.navigate(Routes.CASH_SETUP_CONFIRM_PHONE);
    Navigation.navigate(Routes.CASH_SETUP_IDENTITY);
    expect(useNavigationStore.getState()).toMatchObject({
      activeRoute: Routes.CASH_SETUP_IDENTITY,
      history: [],
    });
  });

  it('resumes within-group history tracking after a boundary', () => {
    const { Navigation, useNavigationStore } = createNavigator(true);
    Navigation.navigate(Routes.CASH_SETUP_CONFIRM_PHONE);
    Navigation.navigate(Routes.CASH_SETUP_IDENTITY);
    Navigation.navigate(Routes.CASH_SETUP_SSN);
    expect(useNavigationStore.getState().history).toEqual([Routes.CASH_SETUP_IDENTITY]);

    Navigation.goBack();
    expect(useNavigationStore.getState()).toMatchObject({
      activeRoute: Routes.CASH_SETUP_IDENTITY,
      history: [],
    });
  });

  it('goBack is a no-op once a boundary emptied the history', () => {
    const { Navigation, useNavigationStore } = createNavigator(true);
    Navigation.navigate(Routes.CASH_SETUP_CONFIRM_PHONE);
    Navigation.navigate(Routes.CASH_SETUP_IDENTITY);
    Navigation.goBack();
    expect(useNavigationStore.getState().activeRoute).toBe(Routes.CASH_SETUP_IDENTITY);
  });

  it('keeps full history without getRouteGroup', () => {
    const { Navigation, useNavigationStore } = createNavigator(false);
    Navigation.navigate(Routes.CASH_SETUP_CONFIRM_PHONE);
    Navigation.navigate(Routes.CASH_SETUP_IDENTITY);
    expect(useNavigationStore.getState().history).toEqual([Routes.CASH_SETUP_PHONE, Routes.CASH_SETUP_CONFIRM_PHONE]);
  });
});

describe('createVirtualNavigator goBack', () => {
  it('uses history before a direct-entry fallback', () => {
    const { Navigation, useNavigationStore } = createPerpsNavigator();
    Navigation.navigate(Routes.PERPS_SEARCH_SCREEN, { type: 'newPosition' });
    Navigation.navigate(Routes.PERPS_NEW_POSITION_SCREEN);

    Navigation.goBack(Routes.PERPS_ACCOUNT_SCREEN);

    expect(useNavigationStore.getState()).toMatchObject({
      activeRoute: Routes.PERPS_SEARCH_SCREEN,
      future: [Routes.PERPS_NEW_POSITION_SCREEN],
      history: [Routes.PERPS_ACCOUNT_SCREEN],
    });
  });

  it('starts a fallback path when direct entry has no history', () => {
    const { Navigation, Pager, useNavigationStore } = createPerpsNavigator();
    Navigation.navigate(Routes.PERPS_NEW_POSITION_SCREEN);
    Pager.beginPath?.();

    Navigation.goBack(Routes.PERPS_SEARCH_SCREEN, { type: 'newPosition' });

    expect(useNavigationStore.getState()).toMatchObject({
      activeRoute: Routes.PERPS_SEARCH_SCREEN,
      future: [],
      history: [],
      params: {
        [Routes.PERPS_SEARCH_SCREEN]: { type: 'newPosition' },
      },
    });
  });
});
