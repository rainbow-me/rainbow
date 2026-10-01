import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';

import '../../../../config/test/storeEnvironment';

import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { getSportsWindow } from '@/features/sports/core/browse';
import {
  GameInterruption,
  GameStatus,
  ScoreColumnKind,
  ScoreColumnWinner,
  SportBrowseTarget,
  type Game,
  type GamesForEventsResult,
  type GamesResult,
  type SearchGamesResult,
  type SportsCatalog,
} from '@/features/sports/core/generated/external/sports/payload';
import { sportsClient } from '@/features/sports/data/api/client';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { sportsPageStores } from '@/features/sports/data/sportsPageStore';
import { getGameId, loadMoreSportsGames, refreshSportsPage, retrySportsPage, useSportsStore } from '@/features/sports/data/sportsStore';
import { useSportsTimeStore } from '@/features/sports/data/sportsWindowStore';
import { time } from '@/framework/core/utils/time';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import Routes from '@/navigation/routesNames';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';

vi.mock('@/features/sports/data/api/client', () => ({
  sportsClient: { getCatalog: vi.fn(), listLiveGames: vi.fn(), listGames: vi.fn(), getGamesForEvents: vi.fn(), searchGames: vi.fn() },
}));

const catalog: SportsCatalog = {
  sports: [
    {
      id: 'basketball',
      name: 'Basketball',
      browseTarget: SportBrowseTarget.SPORT_BROWSE_TARGET_GAMES,
      competitions: [{ id: 'nba', name: 'NBA' }],
    },
    { id: 'tennis', name: 'Tennis', browseTarget: SportBrowseTarget.SPORT_BROWSE_TARGET_GAMES, competitions: [{ id: 'atp', name: 'ATP' }] },
    {
      id: 'soccer',
      name: 'Soccer',
      browseTarget: SportBrowseTarget.SPORT_BROWSE_TARGET_COMPETITIONS,
      competitions: [{ id: 'epl', name: 'Premier League' }],
    },
  ],
  prominentScopeIds: [],
  liveGroupIds: [],
  promotedGameIds: [],
};
const first = game('1');
const second = game('2', { competitionIds: ['atp'] });

function game(id: string, fields: Partial<Game> = {}): Game {
  return {
    id,
    competitionIds: ['nba'],
    startTime: '2026-09-20T12:00:00.000Z',
    status: GameStatus.GAME_STATUS_LIVE,
    interruption: GameInterruption.GAME_INTERRUPTION_UNSPECIFIED,
    participants: [
      { id: 'first', name: 'First', moneylineOutcome: { eventId: id, marketId: 'market', tokenId: `${id}-a`, outcomeIndex: 0 } },
      { id: 'second', name: 'Second' },
    ],
    scoreColumns: [
      {
        kind: ScoreColumnKind.SCORE_COLUMN_KIND_TOTAL,
        first: { value: 0 },
        second: { value: 0 },
        winner: ScoreColumnWinner.SCORE_COLUMN_WINNER_UNSPECIFIED,
      },
    ],
    ...fields,
  };
}

function lookupEvents({ eventIds }: { eventIds: string[] }): Promise<GamesForEventsResult> {
  return Promise.resolve(lookupResponse(eventIds.map(id => game(id))));
}

function lookupResponse(
  games: Game[],
  eventGameMappings = games.map(game => ({ eventId: game.id, gameId: game.id }))
): GamesForEventsResult {
  return {
    catalogRevision: 1,
    catalog,
    games,
    eventGameMappings,
    unavailableEventIds: [],
  };
}

const page = sportsPageStores.main.getState;

function status(host: 'main' | 'predictions' = 'main'): string {
  return sportsPageStores[host].getState().getStatus(useSportsStore.getState());
}

const navigation = sportsNavigationStores.main.getState;

function lookedUpEventIds(): string[][] {
  return vi.mocked(sportsClient.getGamesForEvents).mock.calls.map(([request]) => request.eventIds);
}

/**
 * Runs the clock from `now`, leaving the immediates `settle` uses real.
 */
async function startClock(now: Date): Promise<void> {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'], now });
  await useSportsTimeStore.getState().fetch(undefined, { force: true });
}

/**
 * A response that never arrives.
 */
function pending(): Promise<never> {
  return new Promise<never>(() => {
    // Leave the request in flight.
  });
}

function settle(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

function showMain(): void {
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
}

function showPredictions(): void {
  usePolymarketCategoryStore.setState({ tagId: 'sports' });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN });
}

function openEvent(eventId: string): void {
  polymarketEventIdStore.setState({ eventId });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
}

const unsubscribes: (() => void)[] = [];

beforeEach(async () => {
  useAppStateStore.setState('active');
  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  for (const store of Object.values(sportsNavigationStores)) store.setState(store.getInitialState());
  polymarketEventIdStore.setState({ eventId: null });
  usePolymarketCategoryStore.setState({ tagId: 'trending' });
  useSportsStore.setState({
    catalog: undefined,
    games: {},
    gameFetchedAt: {},
    results: {},
    search: undefined,
    lookup: undefined,
    queryCache: {},
  });
  await useSportsTimeStore.getState().fetch(undefined, { force: true });

  await settle();

  vi.clearAllMocks();
  vi.mocked(sportsClient.getCatalog).mockReset().mockResolvedValue({ catalogRevision: 1, catalog });
  vi.mocked(sportsClient.listLiveGames)
    .mockReset()
    .mockResolvedValue({ catalogRevision: 1, catalog, games: [first] });
  vi.mocked(sportsClient.listGames)
    .mockReset()
    .mockResolvedValue({ catalogRevision: 1, catalog, games: [second] });
  vi.mocked(sportsClient.searchGames)
    .mockReset()
    .mockImplementation(async ({ pageToken }) => ({
      catalogRevision: 1,
      catalog,
      games: pageToken ? [] : [first],
      nextPageToken: pageToken ? undefined : 'page-2',
    }));
  vi.mocked(sportsClient.getGamesForEvents)
    .mockReset()
    .mockImplementation(async ({ eventIds }) =>
      lookupResponse(
        [first],
        eventIds.map(eventId => ({ eventId, gameId: first.id }))
      )
    );

  unsubscribes.push(
    useSportsStore.subscribe(() => undefined),
    sportsPageStores.main.subscribe(() => undefined),
    sportsPageStores.predictions.subscribe(() => undefined)
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const unsubscribe of unsubscribes.splice(0)) unsubscribe();
  vi.useRealTimers();
});

afterAll(() => useSportsStore.getState().reset(true));

// ============ Browse ========================================================= //

it('returns to live games when retrying a removed scope', async () => {
  showMain();
  await settle();
  vi.mocked(sportsClient.listGames).mockRejectedValue(new RainbowFetchError({ message: 'Scope not found', responseBody: { code: 404 } }));
  navigation().select('nba');
  await settle();
  expect(status()).toBe('error');

  await retrySportsPage('main');
  expect(navigation().destination).toBe('live');
});

it('updates scores without publishing a new page', async () => {
  showMain();
  await settle();

  const before = useSportsStore.getState();
  expect(page().sections).toBe(before.results.live?.sections);
  const pageListener = vi.fn();
  unsubscribes.push(sportsPageStores.main.subscribe(pageListener));

  const updated = game('1', { scoreColumns: [{ ...first.scoreColumns[0], first: { value: 1 } }] });
  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [updated] });
  await refreshSportsPage('main');
  await settle();

  const after = useSportsStore.getState();
  expect(after.games['1']?.scoreColumns).not.toEqual(before.games['1']?.scoreColumns);
  expect(pageListener).not.toHaveBeenCalled();
});

it('retains a changed response sequence without publishing an unchanged page', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  const scheduled = game('3', { status: GameStatus.GAME_STATUS_SCHEDULED });
  const otherLive = game('4');
  vi.mocked(sportsClient.listGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first, scheduled, otherLive] });
  showMain();
  await settle();
  navigation().select('nba');
  await settle();

  const before = page();
  const pageListener = vi.fn();
  unsubscribes.push(sportsPageStores.main.subscribe(pageListener));
  vi.mocked(sportsClient.listGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [scheduled, first, otherLive] });
  await refreshSportsPage('main');
  expect([...(useSportsStore.getState().results.nba?.gameIds ?? [])]).toEqual(['3', '1', '4']);
  expect(page()).toBe(before);
  expect(pageListener).not.toHaveBeenCalled();
});

it('keeps the cached preview after a failed category request and clears it after an empty response', async () => {
  showMain();
  await settle();
  const cachedGames = useSportsStore.getState().games;
  const response = Promise.withResolvers<GamesResult>();
  vi.mocked(sportsClient.listGames).mockReturnValueOnce(response.promise);

  navigation().select('nba');
  await settle();

  expect(page().sections).toEqual([{ type: 'live', gameIds: ['1'] }]);
  expect(useSportsStore.getState().games).toBe(cachedGames);
  expect(useSportsStore.getState().results.nba).toBeUndefined();
  expect(useSportsStore.getState().getStatus('isInitialLoad')).toBe(true);
  expect(status()).toBe('loading');

  const displayed = page().sections;
  const pageListener = vi.fn();
  unsubscribes.push(sportsPageStores.main.subscribe(pageListener));
  useSportsStore.setState(state => ({ games: { ...state.games, '1': { ...first, clock: '12:00' } } }));
  expect(page().sections).toBe(displayed);
  expect(pageListener).not.toHaveBeenCalled();

  response.reject(new Error('Category unavailable'));
  await settle();
  expect(page().sections).toBe(displayed);
  expect(pageListener).not.toHaveBeenCalled();
  expect(status()).toBe('error');

  vi.mocked(sportsClient.listGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [] });
  await retrySportsPage('main');
  expect(useSportsStore.getState().games['1']).toBeDefined();
  expect(page().sections).toEqual([]);
  expect(status()).toBe('empty');

  vi.mocked(sportsClient.listGames).mockImplementation(pending);
  void refreshSportsPage('main');
  await settle();
  expect(useSportsStore.getState().getStatus('isInitialLoad')).toBe(false);
  expect(page().sections).toEqual([]);
  expect(status()).toBe('empty');
});

it('clears the preview from the parent page when the competition returns no games', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  const scheduled = game('3', { status: GameStatus.GAME_STATUS_SCHEDULED });
  vi.mocked(sportsClient.listGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [scheduled, first] });
  showMain();
  await settle();
  navigation().select('basketball');
  await settle();

  const response = Promise.withResolvers<GamesResult>();
  vi.mocked(sportsClient.listGames).mockReturnValueOnce(response.promise);
  navigation().open('nba');
  await settle();
  expect(page().sections).toEqual([
    { type: 'live', gameIds: ['1'] },
    { type: 'today', gameIds: ['3'] },
  ]);

  response.resolve({ catalogRevision: 1, catalog, games: [] });
  await settle();
  expect(page().sections).toEqual([]);
  expect(status()).toBe('empty');
});

it('retains visited pages across hosts without refetching them', async () => {
  showMain();
  await settle();
  navigation().select('tennis');
  await settle();
  navigation().select('live');
  await settle();
  expect(page().sections[0]?.gameIds).toEqual(['1']);

  sportsNavigationStores.predictions.getState().select('tennis');
  showPredictions();
  await settle();

  expect(sportsPageStores.predictions.getState().sections[0]?.gameIds).toEqual(['2']);
  expect(sportsClient.listLiveGames).toHaveBeenCalledTimes(1);
  expect(sportsClient.listGames).toHaveBeenCalledTimes(1);
});

it('uses the catalog freshness established by Live and still permits an explicit catalog refresh', async () => {
  showMain();
  await settle();
  navigation().select('all');
  await settle();
  expect(sportsClient.getCatalog).not.toHaveBeenCalled();

  await refreshSportsPage('main');
  expect(sportsClient.getCatalog).toHaveBeenCalledTimes(1);
  expect(page().page).toBe('sports');
});

it('regroups only cached pages affected by a lookup’s section-field changes', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first, second] });
  vi.mocked(sportsClient.listGames).mockImplementation(({ scopeId }) =>
    Promise.resolve({ catalogRevision: 1, catalog, games: scopeId === 'nba' ? [first] : [second] })
  );
  showMain();
  await settle();
  navigation().select('nba');
  await settle();
  navigation().select('tennis');
  await settle();
  const tennis = useSportsStore.getState().results.tennis;
  openEvent('child');
  await settle();

  vi.mocked(sportsClient.getGamesForEvents).mockResolvedValue(
    lookupResponse([{ ...first, status: GameStatus.GAME_STATUS_POSTPONED }], [{ eventId: 'child', gameId: '1' }])
  );
  vi.advanceTimersByTime(time.minutes(1));
  await settle();

  expect(useSportsStore.getState().results.nba?.sections).toEqual([]);
  expect(useSportsStore.getState().results.live?.sections).toEqual([{ type: 'live', scopeId: 'atp', gameIds: ['2'] }]);
  expect(useSportsStore.getState().results.tennis).toBe(tennis);

  vi.mocked(sportsClient.getGamesForEvents).mockResolvedValue(
    lookupResponse([{ ...first, status: GameStatus.GAME_STATUS_SCHEDULED }], [{ eventId: 'child', gameId: '1' }])
  );
  vi.advanceTimersByTime(time.minutes(1));
  await settle();
  expect(useSportsStore.getState().results.nba?.sections).toEqual([{ type: 'today', gameIds: ['1'] }]);
  expect(useSportsStore.getState().results.live?.sections).toEqual([{ type: 'live', scopeId: 'atp', gameIds: ['2'] }]);
  expect(useSportsStore.getState().results.tennis).toBe(tennis);

  vi.mocked(sportsClient.getGamesForEvents).mockResolvedValue(
    lookupResponse(
      [{ ...first, status: GameStatus.GAME_STATUS_SCHEDULED, startTime: new Date(2026, 8, 21, 15).toISOString() }],
      [{ eventId: 'child', gameId: '1' }]
    )
  );
  vi.advanceTimersByTime(time.minutes(1));
  await settle();
  expect(useSportsStore.getState().results.nba?.sections).toEqual([{ type: 'upcoming', gameIds: ['1'] }]);
});

it('preserves browse order through game updates and accepts a new response order', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  const later = game('3', { startTime: '2026-09-20T14:00:00.000Z' });
  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first, second, later] });
  vi.mocked(sportsClient.listGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first, later] });
  showMain();
  await settle();
  navigation().select('nba');
  await settle();
  const unaffectedGroup = useSportsStore.getState().results.live?.sections[1];
  openEvent('child');
  await settle();

  async function deliver(updated: Game): Promise<void> {
    vi.mocked(sportsClient.getGamesForEvents).mockResolvedValue(lookupResponse([updated], [{ eventId: 'child', gameId: '1' }]));
    vi.advanceTimersByTime(time.minutes(1));
    await settle();
  }

  await deliver({ ...first, status: GameStatus.GAME_STATUS_POSTPONED });
  const remaining = useSportsStore.getState().results.nba?.sections;
  expect(remaining).toEqual([{ type: 'live', gameIds: ['3'] }]);

  const rescheduled = { ...first, startTime: '2026-09-20T16:00:00.000Z' };
  await deliver({ ...rescheduled, status: GameStatus.GAME_STATUS_POSTPONED });
  expect(useSportsStore.getState().results.nba?.sections).toBe(remaining);
  await deliver(rescheduled);
  expect(useSportsStore.getState().results.nba?.sections).toEqual([{ type: 'live', gameIds: ['1', '3'] }]);
  expect(useSportsStore.getState().results.live?.sections[1]).toBe(unaffectedGroup);

  await deliver({ ...rescheduled, competitionIds: ['atp'] });
  expect(useSportsStore.getState().results.nba?.sections).toEqual([{ type: 'live', gameIds: ['3'] }]);
  expect(useSportsStore.getState().games['1']).toBeDefined();
  await deliver(rescheduled);
  expect(useSportsStore.getState().results.nba?.sections).toEqual([{ type: 'live', gameIds: ['1', '3'] }]);

  vi.mocked(sportsClient.listGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [later, rescheduled] });
  await refreshSportsPage('main');
  expect(useSportsStore.getState().results.nba?.sections).toEqual([{ type: 'live', gameIds: ['3', '1'] }]);
  await deliver({ ...rescheduled, status: GameStatus.GAME_STATUS_POSTPONED });
  await deliver(rescheduled);
  expect(useSportsStore.getState().results.nba?.sections).toEqual([{ type: 'live', gameIds: ['3', '1'] }]);
});

it('rejects stale responses and missing required catalogs without updating games', async () => {
  vi.mocked(sportsClient.listLiveGames).mockResolvedValueOnce({ catalogRevision: 2, catalog: undefined, games: [first] });
  showMain();
  await settle();
  expect(useSportsStore.getState().catalog).toBeUndefined();
  expect(useSportsStore.getState().games).toEqual({});
  expect(status()).toBe('error');

  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 2, catalog, games: [first] });
  await retrySportsPage('main');
  const acceptedCatalog = useSportsStore.getState().catalog;
  const updated = game('1', { clock: '12:00' });
  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 2, catalog: undefined, games: [updated] });
  await refreshSportsPage('main');
  expect(useSportsStore.getState().catalog).toBe(acceptedCatalog);
  expect(useSportsStore.getState().games['1']?.clock).toBe('12:00');
  expect(vi.mocked(sportsClient.listLiveGames).mock.lastCall?.[0].knownCatalogRevision).toBe(2);

  const before = useSportsStore.getState();
  for (const response of [
    { catalogRevision: 1, catalog, games: [second] },
    { catalogRevision: 3, catalog: undefined, games: [second] },
  ]) {
    vi.mocked(sportsClient.listLiveGames).mockResolvedValue(response);
    await refreshSportsPage('main');
    expect(useSportsStore.getState().catalog).toBe(before.catalog);
    expect(useSportsStore.getState().games).toBe(before.games);
    expect(useSportsStore.getState().results).toBe(before.results);
    expect(page().sections[0]?.gameIds).toEqual(['1']);
    expect(status()).toBe('error');
  }

  vi.mocked(sportsClient.listGames).mockResolvedValue({ catalogRevision: 3, catalog, games: [second] });
  navigation().select('tennis');
  await settle();
  expect(useSportsStore.getState().results.live).toBeUndefined();
  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 3, catalog, games: [first] });
  navigation().select('live');
  await settle();
  expect(page().sections[0]?.gameIds).toEqual(['1']);
  expect(status()).toBe('none');
});

// ============ Days =========================================================== //

it('shows the new day at midnight and requests the new week', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59, 30));
  const later = game('tomorrow', { status: GameStatus.GAME_STATUS_SCHEDULED, startTime: new Date(2026, 8, 21, 16).toISOString() });
  vi.mocked(sportsClient.listGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [later] });
  navigation().select('nba');
  showMain();
  await settle();
  expect(page().sections).toEqual([{ type: 'upcoming', gameIds: ['tomorrow'] }]);

  vi.mocked(sportsClient.listGames).mockImplementation(pending);
  vi.advanceTimersByTime(time.seconds(30));
  await settle();

  expect(page().sections).toEqual([{ type: 'today', gameIds: ['tomorrow'] }]);
  expect(vi.mocked(sportsClient.listGames).mock.calls.map(([request]) => request.window.windowStartTime)).toEqual([
    getSportsWindow(new Date(2026, 8, 20)).windowStartTime,
    getSportsWindow(new Date(2026, 8, 21)).windowStartTime,
  ]);
  expect(vi.mocked(sportsClient.listGames).mock.calls.map(([request]) => request.window.todayCutoffTime)).toEqual([
    getSportsWindow(new Date(2026, 8, 20)).todayCutoffTime,
    getSportsWindow(new Date(2026, 8, 21)).todayCutoffTime,
  ]);
});

it('requests only the current week when the app returns on a later day', async () => {
  await startClock(new Date(2026, 8, 20, 22));
  navigation().select('nba');
  showMain();
  await settle();

  useAppStateStore.setState('background');
  vi.setSystemTime(new Date(2026, 8, 21, 8));
  useAppStateStore.setState('active');
  await settle();

  expect(vi.mocked(sportsClient.listGames).mock.calls.map(([request]) => request.window.windowStartTime)).toEqual([
    getSportsWindow(new Date(2026, 8, 20)).windowStartTime,
    getSportsWindow(new Date(2026, 8, 21)).windowStartTime,
  ]);
  expect(vi.mocked(sportsClient.listGames).mock.calls.map(([request]) => request.window.todayCutoffTime)).toEqual([
    getSportsWindow(new Date(2026, 8, 20)).todayCutoffTime,
    getSportsWindow(new Date(2026, 8, 21)).todayCutoffTime,
  ]);
});

// ============ Status ========================================================= //

it('keeps a page’s failure and retries its own request while another request is active', async () => {
  showMain();
  await settle();
  vi.mocked(sportsClient.listGames).mockRejectedValueOnce(new Error('Schedule unavailable'));
  navigation().select('tennis');
  await settle();
  openEvent('child');
  await settle();
  expect(status()).toBe('error');

  await retrySportsPage('main');
  expect(status()).toBe('none');
  expect(sportsClient.listGames).toHaveBeenCalledTimes(2);
  expect(sportsClient.getGamesForEvents).toHaveBeenCalledTimes(1);
});

it('preserves another host’s current failure during a failure-only sequence', async () => {
  showMain();
  await settle();
  vi.mocked(sportsClient.searchGames).mockRejectedValue(new Error('Offline'));
  navigation().search('main query');
  await settle();

  showPredictions();
  for (const query of ['old query', 'current query']) {
    sportsNavigationStores.predictions.getState().search(query);
    await settle();
  }

  const failed = Object.values(useSportsStore.getState().queryCache).filter(entry => entry?.errorInfo);
  expect(failed).toHaveLength(2);
  expect(status('main')).toBe('error');
  expect(status('predictions')).toBe('error');

  await retrySportsPage('main');
  expect(vi.mocked(sportsClient.searchGames).mock.lastCall?.[0].query).toBe('main query');
});

// ============ Search ========================================================= //

it('preserves Search order across duplicate pages, caps the result, and refreshes from the beginning', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  vi.mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({
      catalogRevision: 1,
      catalog,
      games: Array.from({ length: 20 }, (_, i) => game(`${i}`)),
      nextPageToken: 'page-2',
    })
    .mockResolvedValueOnce({
      catalogRevision: 1,
      catalog,
      games: Array.from({ length: 20 }, (_, i) => game(`${i}`)),
      nextPageToken: 'page-3',
    })
    .mockResolvedValueOnce({
      catalogRevision: 1,
      catalog,
      games: Array.from({ length: 20 }, (_, i) => game(`${i + 15}`)),
      nextPageToken: 'page-4',
    });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');

  expect(vi.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.pageToken)).toEqual([undefined, 'page-2', 'page-3']);
  expect(page().sections[0]?.gameIds).toEqual(Array.from({ length: 30 }, (_, i) => String(i)));
  expect(Object.keys(useSportsStore.getState().games)).toHaveLength(30);
  expect(status()).toBe('none');

  await loadMoreSportsGames('main');
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(3);

  await refreshSportsPage('main');
  expect(vi.mocked(sportsClient.searchGames).mock.calls[3][0].pageToken).toBeUndefined();
  expect(page().sections[0]?.gameIds).toEqual(['1']);
});

it('keeps all Search data when a refresh fails and retries the loaded range', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  const updated = game('1', { clock: '12:00' });
  vi.mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextPageToken: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second], nextPageToken: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updated], nextPageToken: 'page-2' })
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updated], nextPageToken: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second] });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  const before = useSportsStore.getState();

  vi.advanceTimersByTime(time.seconds(60));
  await settle();
  expect(useSportsStore.getState().games).toBe(before.games);
  expect(useSportsStore.getState().search).toBe(before.search);
  expect(status()).toBe('error');

  await retrySportsPage('main');
  expect(vi.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.pageToken)).toEqual([
    undefined,
    'page-2',
    undefined,
    'page-2',
    undefined,
    'page-2',
  ]);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
  expect(useSportsStore.getState().games['1']?.clock).toBe('12:00');
  expect(status()).toBe('none');
});

it('includes load-more requested while a Search refresh is in flight', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  const refresh = Promise.withResolvers<SearchGamesResult>();
  vi.mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextPageToken: 'page-2' })
    .mockImplementationOnce(() => refresh.promise)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second] });
  navigation().search('team');
  showMain();
  await settle();
  const before = page().sections;

  vi.advanceTimersByTime(time.seconds(60));
  await settle();
  const loading = loadMoreSportsGames('main');
  expect(page().sections).toBe(before);
  refresh.resolve({ catalogRevision: 1, catalog, games: [first], nextPageToken: 'page-2' });
  await loading;

  expect(vi.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.pageToken)).toEqual([undefined, undefined, 'page-2']);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
});

it('searches again for a host whose Search result another host replaced', async () => {
  vi.mocked(sportsClient.searchGames).mockImplementation(async ({ query }) => ({
    catalogRevision: 1,
    catalog,
    games: [query === 'first' ? first : second],
  }));
  navigation().search('first');
  showMain();
  await settle();
  sportsNavigationStores.predictions.getState().search('second');
  showPredictions();
  await settle();

  showMain();
  await settle();
  expect(page().sections[0]?.gameIds).toEqual(['1']);
});

it('searches globally from a category and returns to it on cancel', async () => {
  navigation().select('tennis');
  showMain();
  await settle();
  navigation().search('  NBA  ');
  await settle();

  const request = vi.mocked(sportsClient.searchGames).mock.calls[0][0];
  expect(request.query).toBe('NBA');
  expect(request.scopeId).toBeUndefined();
  expect(page().page).toBe('search');

  navigation().search(null);
  await settle();
  expect(navigation().destination).toBe('tennis');
  expect(page().sections[0]?.gameIds).toEqual(['2']);
  expect(sportsClient.listGames).toHaveBeenCalledTimes(1);
});

it('retries a failed continuation without discarding earlier pages', async () => {
  vi.mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextPageToken: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second], nextPageToken: 'page-3' })
    .mockRejectedValueOnce(new Error('Page unavailable'))
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [game('3')], nextPageToken: undefined });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  await loadMoreSportsGames('main');
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
  expect(status()).toBe('error');

  await retrySportsPage('main');
  expect(vi.mocked(sportsClient.searchGames).mock.calls.map(([call]) => call.pageToken)).toEqual([undefined, 'page-2', 'page-3', 'page-3']);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2', '3']);
});

it('restarts one rejected continuation without publishing abandoned data or an error footer', async () => {
  const restart = Promise.withResolvers<SearchGamesResult>();
  const invalidCursor = new RainbowFetchError({ message: 'Invalid page token', responseBody: { code: 400 } });
  vi.mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextPageToken: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog: undefined, games: [second], nextPageToken: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 2, catalog, games: [game('abandoned')], nextPageToken: 'page-2' })
    .mockRejectedValueOnce(invalidCursor)
    .mockImplementationOnce(() => restart.promise)
    .mockResolvedValueOnce({ catalogRevision: 3, catalog: undefined, games: [game('new-2')] });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  const before = useSportsStore.getState();
  const footer = vi.fn();
  unsubscribes.push(useSportsStore.subscribe(page().getStatus, footer));

  const refresh = refreshSportsPage('main');
  await settle();
  expect(useSportsStore.getState().catalog).toBe(before.catalog);
  expect(useSportsStore.getState().games).toBe(before.games);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
  expect(status()).toBe('more');
  expect(footer).not.toHaveBeenCalled();

  restart.resolve({ catalogRevision: 3, catalog, games: [game('new-1')], nextPageToken: 'page-2' });
  await refresh;

  expect(vi.mocked(sportsClient.searchGames).mock.lastCall?.[0].knownCatalogRevision).toBe(3);
  expect(useSportsStore.getState().catalog?.revision).toBe(3);
  expect(page().sections[0]?.gameIds).toEqual(['new-1', 'new-2']);
  expect(Object.keys(useSportsStore.getState().games).sort()).toEqual(['new-1', 'new-2']);
  expect(status()).toBe('none');
});

it('keeps committed Search data when a second continuation fails', async () => {
  const invalidCursor = new RainbowFetchError({ message: 'Invalid page token', responseBody: { code: 400 } });
  vi.mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextPageToken: 'page-2' })
    .mockRejectedValueOnce(invalidCursor)
    .mockResolvedValueOnce({ catalogRevision: 2, catalog, games: [second], nextPageToken: 'page-2' })
    .mockRejectedValueOnce(invalidCursor);
  navigation().search('team');
  showMain();
  await settle();
  const before = useSportsStore.getState();
  await loadMoreSportsGames('main');

  expect(sportsClient.searchGames).toHaveBeenCalledTimes(4);
  expect(useSportsStore.getState().catalog).toBe(before.catalog);
  expect(useSportsStore.getState().games).toBe(before.games);
  expect(page().sections[0]?.gameIds).toEqual(['1']);
  expect(status()).toBe('error');
});

// ============ Events ========================================================= //

it('follows the selected event while a previous lookup is still pending', async () => {
  const previous = Promise.withResolvers<GamesForEventsResult>();
  vi.mocked(sportsClient.getGamesForEvents).mockReturnValueOnce(previous.promise);
  showMain();
  await settle();
  openEvent('previous');
  await settle();
  openEvent('child');
  await settle();

  expect(lookedUpEventIds()).toEqual([['previous'], ['child']]);
  expect(getGameId(useSportsStore.getState(), 'child')).toBe('1');
  expect(useSportsStore.getState().games['1']?.id).toBe('1');

  const queryKey = useSportsStore.getState().queryKey;
  previous.resolve(lookupResponse([second]));
  await settle();
  expect(useSportsStore.getState().queryKey).toBe(queryKey);
  expect(useSportsStore.getState().games['2']).toBeUndefined();
});

it('refreshing game data does not extend the event lookup’s lifetime', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  openEvent('child');
  await settle();
  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  vi.advanceTimersByTime(time.seconds(50));
  showMain();
  await settle();

  vi.advanceTimersByTime(time.seconds(15));
  openEvent('1');
  await settle();
  expect(lookedUpEventIds()).toEqual([['child']]);

  openEvent('child');
  await settle();
  expect(lookedUpEventIds()).toEqual([['child'], ['child']]);
});

it('retains the selected game and releases games dropped by the refreshed page', async () => {
  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [second] });
  vi.mocked(sportsClient.getGamesForEvents).mockImplementation(lookupEvents);
  showMain();
  await settle();
  openEvent('3');
  await settle();

  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first] });
  await refreshSportsPage('main');

  expect(Object.keys(useSportsStore.getState().games).sort()).toEqual(['1', '3']);
});

it('uses a newly fetched game after an unavailable lookup and retains it while selected', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  vi.mocked(sportsClient.getGamesForEvents).mockImplementation(lookupEvents);
  openEvent('1');
  await settle();

  vi.mocked(sportsClient.getGamesForEvents).mockResolvedValue({
    catalogRevision: 1,
    catalog,
    games: [],
    eventGameMappings: [],
    unavailableEventIds: ['1'],
  });
  vi.advanceTimersByTime(time.minutes(1));
  await settle();
  expect(getGameId(useSportsStore.getState(), '1')).toBeNull();
  expect(useSportsStore.getState().games).toEqual({});

  showMain();
  await settle();
  expect(getGameId(useSportsStore.getState(), '1')).toBe('1');

  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [second] });
  await refreshSportsPage('main');
  expect(page().sections[0]?.gameIds).toEqual(['2']);
  expect(getGameId(useSportsStore.getState(), '1')).toBe('1');
  expect(useSportsStore.getState().games['1']?.id).toBe('1');
});

// ============ Navigation ===================================================== //

it('keeps the category tab while browsing into it and Back returns through its parents', async () => {
  vi.mocked(sportsClient.listLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [] });
  showMain();
  await settle();

  navigation().select('all');
  navigation().open('basketball');
  navigation().open('nba');
  expect(page().selectedCategory).toBe('all');
  expect(page().back).toBe('basketball');

  navigation().open(page().back ?? 'live');
  expect(page().back).toBe('all');
  navigation().open(page().back ?? 'live');
  expect(page().page).toBe('sports');
  expect(page().back).toBeUndefined();
});

it('filters catalog scopes for Search and opens a result at its category root', async () => {
  showMain();
  await settle();
  navigation().search('te');

  expect(page().directoryIds).toEqual(['tennis']);
  navigation().open('tennis');
  expect(navigation().query).toBeNull();
  expect(page().selectedCategory).toBe('all');
  expect(page().back).toBe('all');
});
