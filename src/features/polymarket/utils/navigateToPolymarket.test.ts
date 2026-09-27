import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { device } from '@/storage';

import { navigateToPolymarketCategory, navigateToPolymarketSportsLeague } from './navigateToPolymarket';

jest.mock('@/features/polymarket/constants', () => ({ CATEGORIES: { sports: {}, politics: {} } }));
jest.mock('@/features/polymarket/stores/usePolymarketCategoryStore', () => ({
  usePolymarketCategoryStore: { getState: () => ({ setTagId: mockSetTagId }) },
}));
jest.mock('@/navigation/Navigation', () => ({ __esModule: true, default: { handleAction: jest.fn() } }));
jest.mock('@/storage', () => ({ device: { get: jest.fn(), set: jest.fn() } }));

const mockSetTagId = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(device.get).mockReturnValue(true);
  sportsNavigationStores.predictions.setState(sportsNavigationStores.predictions.getInitialState());
});

test('opens the destination directly in the Predictions host', () => {
  navigateToPolymarketSportsLeague('us-open');

  expect(sportsNavigationStores.predictions.getState()).toMatchObject({ category: 'us-open', destination: 'us-open', query: null });
  expect(usePolymarketCategoryStore.getState().setTagId).toHaveBeenCalledWith('sports');
  expect(Navigation.handleAction).toHaveBeenCalledWith(Routes.POLYMARKET_NAVIGATOR, {
    initialRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
    routeRequestKey: expect.any(Number),
  });
});

test('gives a repeated deep link a new route request so the mounted view scrolls again', () => {
  navigateToPolymarketSportsLeague('us-open');
  navigateToPolymarketSportsLeague('us-open');

  const calls = jest.mocked(Navigation.handleAction).mock.calls;
  expect(calls[0][1]).toEqual({ initialRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN, routeRequestKey: expect.any(Number) });
  expect(calls[1][1]).not.toEqual(calls[0][1]);
});

test('category navigation preserves the separate Sports destination', () => {
  navigateToPolymarketCategory('politics');

  expect(usePolymarketCategoryStore.getState().setTagId).toHaveBeenCalledWith('politics');
  expect(sportsNavigationStores.predictions.getState().destination).toBe('live');
});

test('opens Predictions without selecting an unsupported category', () => {
  navigateToPolymarketCategory('tradfi');

  expect(mockSetTagId).not.toHaveBeenCalled();
  expect(Navigation.handleAction).toHaveBeenCalledWith(Routes.POLYMARKET_NAVIGATOR, undefined);
});
