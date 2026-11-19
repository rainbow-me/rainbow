import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePolymarketNavigationStore } from '@/features/polymarket/navigation/polymarketNavigation';
import { navigateToPolymarket, navigateToPolymarketPortfolio } from '@/features/polymarket/utils/navigateToPolymarket';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { device } from '@/storage';

vi.mock('@/features/polymarket/constants', () => ({ CATEGORIES: {} }));
vi.mock('@/navigation/Navigation', () => ({ default: { handleAction: vi.fn() } }));
vi.mock('@/navigation/RouteContext', () => ({ UseRouteProvider: ({ children }: { children: unknown }) => children }));
vi.mock('@/state/navigation/navigationStore', () => ({ setActiveRoute: vi.fn() }));
vi.mock('@/storage', () => ({ device: { get: vi.fn(), set: vi.fn() } }));
vi.mock('@/features/polymarket/stores/usePolymarketCategoryStore', () => ({
  usePolymarketCategoryStore: { getState: () => ({ setTagId: vi.fn() }) },
}));
vi.mock('@/features/sports/data/sportsNavigationStore', () => ({ sportsNavigationStores: {} }));

const handleAction = vi.mocked(Navigation.handleAction as (route: string, params?: unknown) => void);

describe('navigateToPolymarket', () => {
  // The Predictions tab selected at the moment the navigator itself is dispatched.
  let openedOn: () => string | undefined;

  beforeEach(() => {
    handleAction.mockReset();
    usePolymarketNavigationStore.getState().resetNavigationState();
    vi.mocked(device.get).mockReturnValue(true);
    let tab: string | undefined;
    handleAction.mockImplementation(route => {
      if (route === Routes.POLYMARKET_NAVIGATOR) tab = usePolymarketNavigationStore.getState().activeRoute;
    });
    openedOn = () => tab;
  });

  it('selects the requested tab before opening the navigator', () => {
    navigateToPolymarketPortfolio();
    expect(openedOn()).toBe(Routes.POLYMARKET_ACCOUNT_SCREEN);
  });

  it('selects the tab only once the first-run explain sheet closes', () => {
    vi.mocked(device.get).mockReturnValue(false);
    navigateToPolymarketPortfolio();

    expect(handleAction).toHaveBeenCalledTimes(1);
    expect(handleAction).toHaveBeenCalledWith(Routes.POLYMARKET_EXPLAIN_SHEET, expect.anything());
    expect(usePolymarketNavigationStore.getState().activeRoute).toBe(Routes.POLYMARKET_BROWSE_EVENTS_SCREEN);

    const explainParams = handleAction.mock.calls[0][1] as { onDismiss: () => void };
    explainParams.onDismiss();
    expect(openedOn()).toBe(Routes.POLYMARKET_ACCOUNT_SCREEN);
  });

  it('keeps an already selected tab on a plain open', () => {
    usePolymarketNavigationStore.getState().navigate(Routes.POLYMARKET_ACCOUNT_SCREEN);
    navigateToPolymarket();
    expect(openedOn()).toBe(Routes.POLYMARKET_ACCOUNT_SCREEN);
  });
});
