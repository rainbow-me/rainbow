import Routes from '@/navigation/routesNames';
import { type CashDepositSetupRoute } from '@/navigation/types';

import { createVirtualNavigator } from './createVirtualNavigator';

jest.mock('@/navigation/Navigation', () => ({
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
