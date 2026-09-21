import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

import { prefetchRoute } from '@/navigation/prefetchRegistry';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { setActiveRoute } from '@/state/navigation/navigationStore';

import Navigation, { onDidPop, onWillPop } from './Navigation';

jest.mock('@/navigation/prefetchRegistry', () => ({ prefetchRoute: jest.fn() }));
jest.mock('@/navigation/virtualNavigators', () => ({ VIRTUAL_NAVIGATORS: {} }));
jest.mock('react-native-reanimated', () => ({ makeMutable: (value: unknown) => ({ value }) }));

const navigationRef = createNavigationContainerRef<RootStackParamList>();
const dispatch = jest.spyOn(navigationRef, 'dispatch').mockImplementation(() => undefined);
jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
const route = { key: 'event-source', name: Routes.POLYMARKET_EVENT_SCREEN };
const destination = Routes.POLYMARKET_DEPOSIT_SCREEN;
jest.spyOn(navigationRef, 'getCurrentRoute').mockReturnValue(route);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  Navigation.setNavigationRef(navigationRef);
  setActiveRoute(route.name);
});

afterEach(() => {
  onDidPop();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

test('guarded navigation during sheet closing never prefetches or dispatches, including after dismissal', () => {
  onWillPop();
  Navigation.navigateIfCurrent(() => true, destination);

  expect(prefetchRoute).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
  onDidPop();
  jest.runOnlyPendingTimers();
  expect(prefetchRoute).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();
});

test('a false source predicate drops the action without blocking a subsequent current action', () => {
  Navigation.navigateIfCurrent(() => false, destination);
  expect(prefetchRoute).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();

  Navigation.navigateIfCurrent(() => true, destination);
  expect(prefetchRoute).toHaveBeenCalledTimes(1);
  expect(prefetchRoute).toHaveBeenCalledWith(destination, undefined);
  expect(dispatch).toHaveBeenCalledWith(CommonActions.navigate({ name: destination }));
});

test('ordinary navigation still waits for sheet dismissal and then prefetches and dispatches', () => {
  onWillPop();
  Navigation.handleAction(destination);
  expect(prefetchRoute).not.toHaveBeenCalled();
  expect(dispatch).not.toHaveBeenCalled();

  onDidPop();
  jest.runOnlyPendingTimers();
  expect(prefetchRoute).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledTimes(1);
  expect(dispatch).toHaveBeenCalledWith(CommonActions.navigate({ name: destination }));
});
