import { AppState } from 'react-native';

import { getSportsWindow } from '@/features/sports/core/browse';
import { SportsCatalog } from '@/features/sports/core/generated/sports';
import { sportsClient } from '@/features/sports/data/api/client';
import { sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

jest.mock('@/features/sports/data/api/client', () => ({
  sportsClient: { getCatalog: jest.fn(), getLiveGames: jest.fn(), getGames: jest.fn(), lookupGames: jest.fn(), searchGames: jest.fn() },
}));
jest.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: jest
    .requireActual<typeof import('@storesjs/stores')>('@storesjs/stores')
    .createBaseStore(() => ({ activeRoute: 'SportsScreen' })),
}));

const catalog = SportsCatalog.fromJSON({
  revision: 1,
  sports: [{ id: 'basketball', name: 'Basketball', browse: 'BROWSE_GAMES', competitions: [{ id: 'nba', name: 'NBA' }] }],
});
const owner = Symbol('detail');
let stop: () => void;

function settle(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'queueMicrotask'] });
  jest.setSystemTime(new Date(2026, 8, 21, 12));
  AppState.currentState = 'active';
  useSportsStore.getState().clear();
  useSportsViewStore.setState({ ...useSportsViewStore.getInitialState(), window: getSportsWindow() });
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  jest.mocked(sportsClient.getCatalog).mockResolvedValue(catalog);
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [] });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [] });
  stop = useSportsStore.subscribe(() => undefined);
});

afterEach(() => {
  stop();
  sportsActions.setHostVisibility('main', false);
  sportsActions.removeLookupConsumer(owner);
  syncSportsActivity();
  jest.useRealTimers();
});

afterAll(() => useSportsStore.getState().reset(true));

it('shares native observation and releases the calendar timer when the last consumer leaves', async () => {
  const updateWindow = jest.spyOn(sportsActions, 'updateWindow');
  sportsActions.setHostVisibility('main', true);
  syncSportsActivity();
  sportsActions.setLookupConsumer(owner, { route: Routes.POLYMARKET_EVENT_SCREEN, eventIds: ['1'], active: true });
  syncSportsActivity();
  await settle();

  expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
  expect(updateWindow).toHaveBeenCalledTimes(1);
  const subscription = jest.mocked(AppState.addEventListener).mock.results[0].value;
  sportsActions.setHostVisibility('main', false);
  syncSportsActivity();
  expect(subscription.remove).not.toHaveBeenCalled();

  sportsActions.removeLookupConsumer(owner);
  syncSportsActivity();
  await settle();
  expect(subscription.remove).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(24 * 60 * 60 * 1000);
  expect(updateWindow).toHaveBeenCalledTimes(1);
});

it('pauses requests in the background and resumes with the new calendar window', async () => {
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  sportsActions.setHostVisibility('main', true);
  syncSportsActivity();
  await settle();
  const result = useSportsStore.getState().results['scope:nba'];
  const onChange = jest.mocked(AppState.addEventListener).mock.calls[0][1];

  onChange('background');
  await settle();
  expect(useSportsStore.getState().enabled).toBe(false);
  expect(useSportsViewStore.getState().hosts.main.visible).toBe(true);
  expect(useSportsStore.getState().results['scope:nba']).toBe(result);
  await sportsActions.refresh('main');
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);

  jest.setSystemTime(new Date(2026, 8, 22, 8));
  onChange('active');
  await settle();
  expect(sportsClient.getGames).toHaveBeenCalledTimes(2);
  expect(sportsClient.getGames).toHaveBeenLastCalledWith(
    { scopeId: 'nba', from: new Date(2026, 8, 22).toISOString(), until: new Date(2026, 8, 29).toISOString() },
    expect.any(AbortController)
  );
});
