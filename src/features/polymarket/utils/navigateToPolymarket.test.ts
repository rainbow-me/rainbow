import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { sportsActions } from '@/features/sports/data/sportsStore';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { device } from '@/storage';

import { navigateToPolymarketCategory, navigateToPolymarketSportsLeague } from './navigateToPolymarket';

jest.mock('@/features/polymarket/constants', () => ({ CATEGORIES: { sports: {}, politics: {} } }));
jest.mock('@/features/polymarket/stores/usePolymarketCategoryStore', () => ({
  usePolymarketCategoryStore: { getState: () => ({ setTagId: mockSetTagId }) },
}));
jest.mock('@/features/sports/data/sportsStore', () => ({ sportsActions: { selectDestination: jest.fn() } }));
jest.mock('@/navigation/Navigation', () => ({ __esModule: true, default: { handleAction: jest.fn() } }));
jest.mock('@/storage', () => ({ device: { get: jest.fn(), set: jest.fn() } }));

const mockSetTagId = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(device.get).mockReturnValue(true);
});

test('opens catalog scope IDs directly in the Predictions host', () => {
  navigateToPolymarketSportsLeague('us-open');

  expect(sportsActions.selectDestination).toHaveBeenCalledWith('predictions', { type: 'scope', scopeId: 'us-open' });
  expect(usePolymarketCategoryStore.getState().setTagId).toHaveBeenCalledWith('sports');
  expect(Navigation.handleAction).toHaveBeenCalledWith(Routes.POLYMARKET_NAVIGATOR, {
    initialRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
    routeRequestKey: expect.any(Number),
  });
});

test.each(['live', 'all'])('opens the %s destination without treating it as a scope', destination => {
  navigateToPolymarketSportsLeague(destination);

  expect(sportsActions.selectDestination).toHaveBeenCalledWith('predictions', { type: destination });
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
  expect(sportsActions.selectDestination).not.toHaveBeenCalled();
});

test('ignores unknown categories', () => {
  navigateToPolymarketCategory('missing');

  expect(mockSetTagId).not.toHaveBeenCalled();
  expect(Navigation.handleAction).not.toHaveBeenCalled();
});
