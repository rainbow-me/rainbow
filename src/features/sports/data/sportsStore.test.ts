import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { useDiscoverNavigationStore } from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSearchQueryStore } from '@/features/discover/stores/discoverSearchQueryStore';
import { polymarketEventIdStore } from '@/features/polymarket/stores/polymarketEventIdStore';
import { usePolymarketCategoryStore } from '@/features/polymarket/stores/usePolymarketCategoryStore';
import { getSportsWindow } from '@/features/sports/core/browse';
import {
  Game,
  Game_Status,
  Sport_Browse,
  SportsCatalog,
  type GetGamesResponse,
  type LookupGamesResponse,
  type SearchGamesResponse,
} from '@/features/sports/core/generated/sports';
import * as sections from '@/features/sports/core/sections';
import { sportsClient } from '@/features/sports/data/api/client';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { sportsPageStatusStores, sportsPageStores } from '@/features/sports/data/sportsPageStore';
import { sportsRequestStore } from '@/features/sports/data/sportsRequestStore';
import {
  getGameId,
  getPageQueryKey,
  loadMoreSportsGames,
  refreshSportsPage,
  retrySportsPage,
  useSportsStore,
} from '@/features/sports/data/sportsStore';
import { useSportsTimeStore } from '@/features/sports/data/sportsWindowStore';
import { time } from '@/framework/core/utils/time';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import Routes from '@/navigation/routesNames';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';

jest.mock('@/features/sports/data/api/client', () => ({
  sportsClient: { getCatalog: jest.fn(), getLiveGames: jest.fn(), getGames: jest.fn(), lookupGames: jest.fn(), searchGames: jest.fn() },
}));
jest.mock('@/state/navigation/navigationStore', () => ({
  useNavigationStore: jest
    .requireActual<typeof import('@storesjs/stores')>('@storesjs/stores')
    .createBaseStore(() => ({ activeRoute: 'SportsScreen' })),
}));
jest.mock('@/features/polymarket/stores/usePolymarketCategoryStore', () => ({
  usePolymarketCategoryStore: jest
    .requireActual<typeof import('@storesjs/stores')>('@storesjs/stores')
    .createBaseStore(() => ({ tagId: 'trending' })),
}));

const catalog = SportsCatalog.fromJSON({
  sports: [
    { id: 'basketball', name: 'Basketball', browse: 'BROWSE_GAMES', competitions: [{ id: 'nba', name: 'NBA' }] },
    { id: 'tennis', name: 'Tennis', browse: 'BROWSE_GAMES', competitions: [{ id: 'atp', name: 'ATP' }] },
    { id: 'soccer', name: 'Soccer', browse: Sport_Browse.BROWSE_COMPETITIONS, competitions: [{ id: 'epl', name: 'Premier League' }] },
  ],
});
const first = game('1');
const second = game('2', { competitionIds: ['atp'] });

function game(id: string, fields: Partial<Game> = {}): Game {
  return Game.fromJSON({
    id,
    competitionIds: ['nba'],
    startsAt: '2026-09-20T12:00:00.000Z',
    status: Game_Status.STATUS_LIVE,
    participants: [{ name: 'First', winner: { eventId: id, marketId: 'market', tokenId: `${id}-a` } }, { name: 'Second' }],
    score: [{ kind: 'KIND_TOTAL', first: { value: 0 }, second: { value: 0 } }],
    ...fields,
  });
}

function lookupEvents({ eventIds }: { eventIds: string[] }): Promise<LookupGamesResponse> {
  return Promise.resolve(lookupResponse(eventIds.map(id => game(id))));
}

function lookupResponse(games: Game[], resolved = games.map(game => ({ eventId: game.id, gameId: game.id }))): LookupGamesResponse {
  return {
    catalogRevision: 1,
    catalog,
    games,
    resolved,
    unavailableEventIds: [],
  };
}

function page(host: 'main' | 'predictions' = 'main'): ReturnType<typeof sportsPageStores.main.getState> {
  return sportsPageStores[host].getState();
}

function status(host: 'main' | 'predictions' = 'main'): ReturnType<typeof sportsPageStatusStores.main.getState> {
  return sportsPageStatusStores[host].getState();
}

function navigation(host: 'main' | 'predictions' = 'main'): ReturnType<typeof sportsNavigationStores.main.getState> {
  return sportsNavigationStores[host].getState();
}

function lookedUpEventIds(): string[][] {
  return jest.mocked(sportsClient.lookupGames).mock.calls.map(([request]) => request.eventIds);
}

/**
 * Runs the clock from `now`, leaving the immediates `settle` uses real.
 */
async function startClock(now: Date): Promise<void> {
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'], now });
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
  useDiscoverSearchQueryStore.setState(useDiscoverSearchQueryStore.getInitialState());
  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  for (const store of Object.values(sportsNavigationStores)) store.setState(store.getInitialState());
  polymarketEventIdStore.setState({ eventId: null });
  usePolymarketCategoryStore.setState({ tagId: 'trending' });
  discoverEventListsStore.setState(discoverEventListsStore.getInitialState());
  useDiscoverNavigationStore.setState({ activeSection: 'for_you' });
  useSportsStore.setState({
    catalog: undefined,
    games: {},
    answeredAt: new Map(),
    results: {},
    search: undefined,
    eventGameIds: {},
    queryCache: {},
  });
  await useSportsTimeStore.getState().fetch(undefined, { force: true });

  await settle();

  jest.clearAllMocks();
  jest.mocked(sportsClient.getCatalog).mockReset().mockResolvedValue({ catalogRevision: 1, catalog });
  jest
    .mocked(sportsClient.getLiveGames)
    .mockReset()
    .mockResolvedValue({ catalogRevision: 1, catalog, games: [first] });
  jest
    .mocked(sportsClient.getGames)
    .mockReset()
    .mockResolvedValue({ catalogRevision: 1, catalog, games: [second] });
  jest
    .mocked(sportsClient.searchGames)
    .mockReset()
    .mockImplementation(async ({ cursor }) => ({
      catalogRevision: 1,
      catalog,
      games: cursor ? [] : [first],
      nextCursor: cursor ? undefined : 'page-2',
    }));
  jest
    .mocked(sportsClient.lookupGames)
    .mockReset()
    .mockResolvedValue({
      catalogRevision: 1,
      catalog,
      games: [first],
      resolved: [{ eventId: 'child', gameId: '1' }],
      unavailableEventIds: ['unsupported'],
    });

  unsubscribes.push(
    useSportsStore.subscribe(() => undefined),
    sportsPageStores.main.subscribe(() => undefined),
    sportsPageStores.predictions.subscribe(() => undefined),
    sportsPageStatusStores.main.subscribe(() => undefined)
  );
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const unsubscribe of unsubscribes.splice(0)) unsubscribe();
  jest.useRealTimers();
});

afterAll(() => useSportsStore.getState().reset(true));

// ============ Browse ========================================================= //

it('groups a page once and reuses its sections for display and score-only responses', async () => {
  const groupGames = jest.spyOn(sections, 'groupSportsGames');
  showMain();
  await settle();

  expect(groupGames).toHaveBeenCalledTimes(1);
  const before = useSportsStore.getState();
  expect(page().sections).toBe(before.results.live?.sections);
  const pageListener = jest.fn();
  unsubscribes.push(sportsPageStores.main.subscribe(pageListener));

  const updated = game('1', { score: [{ ...first.score[0], first: { value: 1 } }] });
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [updated] });
  await refreshSportsPage('main');
  await settle();

  const after = useSportsStore.getState();
  expect(after.games['1']?.score).not.toEqual(before.games['1']?.score);
  expect(after.games['1']?.participants).toBe(before.games['1']?.participants);
  expect(after.results).toBe(before.results);
  expect(after.catalog).toBe(before.catalog);
  expect(groupGames).toHaveBeenCalledTimes(1);
  expect(pageListener).not.toHaveBeenCalled();
});

it('stores bounded browse responses without repeating eligibility or ranking', async () => {
  const games = Array.from({ length: 30 }, (_, index) => game(String(index).padStart(2, '0')));
  const selectGames = jest.spyOn(sections, 'selectSportsGames');
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games });
  showMain();
  await settle();

  const before = page().sections;
  await refreshSportsPage('main');
  await settle();

  expect(selectGames).not.toHaveBeenCalled();
  expect(page().sections).toBe(before);
  expect(page().sections[0].gameIds).toEqual(games.slice(0, 30).map(game => game.id));
  expect(Object.keys(useSportsStore.getState().games)).toHaveLength(30);
});

it('keeps the page’s query-cache identity through score updates', async () => {
  showMain();
  await settle();
  const before = useSportsStore.getState();

  for (let value = 1; value <= 3; value++) {
    useSportsStore.setState(state => ({ games: { ...state.games, '1': game('1', { score: [{ ...first.score[0], first: { value } }] }) } }));
  }

  expect(useSportsStore.getState().queryCache).toBe(before.queryCache);
  expect(useSportsStore.getState().results.live?.queryKey).toBe(before.results.live?.queryKey);
});

it('retains visited pages across hosts without refetching them', async () => {
  showMain();
  await settle();
  navigation().select('tennis');
  await settle();
  navigation().select('live');
  await settle();
  expect(page().sections[0]?.gameIds).toEqual(['1']);

  navigation('predictions').select('tennis');
  showPredictions();
  await settle();

  expect(page('predictions').sections[0]?.gameIds).toEqual(['2']);
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
});

it('returns to the sports directory without fetching the catalog again within a minute', async () => {
  navigation().select('all');
  showMain();
  await settle();
  navigation().select('live');
  await settle();
  navigation().select('all');
  await settle();

  expect(sportsClient.getCatalog).toHaveBeenCalledTimes(1);
});

it('loads a cold directory scope with one Games request and no catalog prefetch', async () => {
  navigation().select('soccer');
  showMain();
  await settle();

  expect(sportsClient.getCatalog).not.toHaveBeenCalled();
  expect(sportsClient.getLiveGames).not.toHaveBeenCalled();
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
  expect(sportsClient.getGames).toHaveBeenCalledWith(
    { scopeId: 'soccer', ...getSportsWindow(), knownCatalogRevision: undefined },
    expect.anything()
  );
  expect(page()).toMatchObject({ page: 'competitions', directoryIds: ['epl'] });

  navigation().open('epl');
  await settle();
  expect(sportsClient.getGames).toHaveBeenCalledWith(
    expect.objectContaining({ scopeId: 'epl', knownCatalogRevision: 1 }),
    expect.anything()
  );
  expect(sportsClient.getCatalog).not.toHaveBeenCalled();
});

it('discards an interrupted response instead of publishing it', async () => {
  const response = Promise.withResolvers<GetGamesResponse>();
  jest.mocked(sportsClient.getLiveGames).mockImplementationOnce(() => response.promise);
  showMain();
  await settle();
  navigation().select('tennis');
  await settle();
  response.resolve({ catalogRevision: 1, catalog, games: [first] });
  await settle();

  expect(page().sections[0]?.gameIds).toEqual(['2']);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});

it('stores the server’s thirty Games in each scheduled section', async () => {
  const today = getSportsWindow().from;
  const date = new Date(today);
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
  const live = Array.from({ length: 30 }, (_, i) => game(String(100 + i), { startsAt: today }));
  const scheduled = Array.from({ length: 30 }, (_, i) => game(String(200 + i), { status: Game_Status.STATUS_SCHEDULED, startsAt: today }));
  const upcoming = Array.from({ length: 30 }, (_, i) =>
    game(String(300 + i), { status: Game_Status.STATUS_SCHEDULED, startsAt: tomorrow })
  );
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [...live, ...scheduled, ...upcoming] });
  navigation().select('nba');
  showMain();
  await settle();

  const expectedSections = [
    { type: 'live', gameIds: live.slice(0, 30).map(game => game.id) },
    { type: 'today', gameIds: scheduled.slice(0, 30).map(game => game.id) },
    { type: 'upcoming', gameIds: upcoming.slice(0, 30).map(game => game.id) },
  ];
  expect(page().sections).toEqual(expectedSections);
  expect(Object.keys(useSportsStore.getState().games)).toEqual(expectedSections.flatMap(section => section.gameIds));
});

it('stores the server’s thirty Games in each Live group', async () => {
  const basketball = Array.from({ length: 30 }, (_, i) => game(String(100 + i)));
  const tennis = Array.from({ length: 30 }, (_, i) => game(String(200 + i), { competitionIds: ['atp'] }));
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [...basketball, ...tennis] });
  showMain();
  await settle();

  const expectedSections = [
    { type: 'live', scopeId: 'nba', gameIds: basketball.slice(0, 30).map(game => game.id) },
    { type: 'live', scopeId: 'atp', gameIds: tennis.slice(0, 30).map(game => game.id) },
  ];
  expect(page().sections).toEqual(expectedSections);
  expect(Object.keys(useSportsStore.getState().games)).toEqual(expectedSections.flatMap(section => section.gameIds));
});

it('moves a game between sections as its status changes in any response', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  const scheduled = game('1', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 20, 18).toISOString() });
  const answer = (status: Game_Status) => lookupResponse([{ ...scheduled, status }], [{ eventId: 'child', gameId: '1' }]);
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [scheduled] });
  navigation().select('nba');
  showMain();
  await settle();
  expect(page().sections).toEqual([{ type: 'today', gameIds: ['1'] }]);

  openEvent('child');
  await settle();
  expect(page().sections).toEqual([{ type: 'live', gameIds: ['1'] }]);

  jest.mocked(sportsClient.lookupGames).mockResolvedValue(answer(Game_Status.STATUS_POSTPONED));
  jest.advanceTimersByTime(time.minutes(1));
  await settle();
  expect(page().sections).toEqual([]);

  jest.mocked(sportsClient.lookupGames).mockResolvedValue(answer(Game_Status.STATUS_SCHEDULED));
  jest.advanceTimersByTime(time.minutes(1));
  await settle();
  expect(page().sections).toEqual([{ type: 'today', gameIds: ['1'] }]);
});

it('regroups only cached pages affected by a lookup’s section-field changes', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first, second] });
  jest
    .mocked(sportsClient.getGames)
    .mockImplementation(({ scopeId }) => Promise.resolve({ catalogRevision: 1, catalog, games: scopeId === 'nba' ? [first] : [second] }));
  showMain();
  await settle();
  navigation().select('nba');
  await settle();
  navigation().select('tennis');
  await settle();
  const tennis = useSportsStore.getState().results.tennis;
  openEvent('child');
  await settle();

  const selectGames = jest.spyOn(sections, 'selectSportsGames');
  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue(lookupResponse([{ ...first, status: Game_Status.STATUS_POSTPONED }], [{ eventId: 'child', gameId: '1' }]));
  jest.advanceTimersByTime(time.minutes(1));
  await settle();

  expect(selectGames).toHaveBeenCalledTimes(2);
  expect(useSportsStore.getState().results.nba?.sections).toEqual([]);
  expect(useSportsStore.getState().results.live?.sections).toEqual([{ type: 'live', scopeId: 'atp', gameIds: ['2'] }]);
  expect(useSportsStore.getState().results.tennis).toBe(tennis);
});

it('keeps score polls off page Game comparisons after a status change', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first, second] });
  showMain();
  await settle();
  openEvent('child');
  await settle();

  const finished = { ...first, status: Game_Status.STATUS_ENDED };
  jest.mocked(sportsClient.lookupGames).mockResolvedValue(lookupResponse([finished], [{ eventId: 'child', gameId: '1' }]));
  jest.advanceTimersByTime(time.minutes(1));
  await settle();

  jest.mocked(sportsClient.lookupGames).mockResolvedValue(lookupResponse([second]));
  openEvent('2');
  await settle();
  const compareGames = jest.spyOn(sections, 'areSectionInputsEqual');

  const scored = game('2', { competitionIds: ['atp'], score: [{ ...second.score[0], first: { value: 1 } }] });
  jest.mocked(sportsClient.lookupGames).mockResolvedValue(lookupResponse([scored]));
  jest.advanceTimersByTime(time.minutes(1));
  await settle();
  expect(useSportsStore.getState().games['2']).toEqual(scored);
  expect(compareGames).not.toHaveBeenCalled();
});

it('reuses stored sections after the page remounts and refreshes', async () => {
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first] });
  navigation().select('nba');
  showMain();
  await settle();
  const stored = useSportsStore.getState().results.nba;

  for (const unsubscribe of unsubscribes.splice(0)) unsubscribe();
  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  await settle();

  unsubscribes.push(
    useSportsStore.subscribe(() => undefined),
    sportsPageStores.main.subscribe(() => undefined)
  );
  showMain();
  await settle();
  expect(page().sections).toBe(stored?.sections);

  await refreshSportsPage('main');
  expect(page().sections).toBe(stored?.sections);
  const compareGames = jest.spyOn(sections, 'areSectionInputsEqual');
  const scored = game('1', { score: [{ ...first.score[0], first: { value: 1 } }] });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [scored] });
  await refreshSportsPage('main');
  expect(compareGames).not.toHaveBeenCalled();
});

it('removes a game from a page when any response moves it out of the page’s scope', async () => {
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first] });
  navigation().select('nba');
  showMain();
  await settle();
  expect(page().sections).toEqual([{ type: 'live', gameIds: ['1'] }]);

  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue(lookupResponse([game('1', { competitionIds: ['atp'] })], [{ eventId: 'child', gameId: '1' }]));
  openEvent('child');
  await settle();

  expect(page().sections).toEqual([]);
});

it('reorders a page when any response changes a start time', async () => {
  const at = (hours: number) => new Date(Date.parse(getSportsWindow().from) + time.hours(hours)).toISOString();
  const early = game('1', { status: Game_Status.STATUS_SCHEDULED, startsAt: at(33) });
  const late = game('2', { status: Game_Status.STATUS_SCHEDULED, startsAt: at(34) });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [early, late] });
  navigation().select('nba');
  showMain();
  await settle();
  expect(page().sections).toEqual([{ type: 'upcoming', gameIds: ['1', '2'] }]);

  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue(lookupResponse([{ ...early, startsAt: at(35) }], [{ eventId: 'child', gameId: '1' }]));
  openEvent('child');
  await settle();

  expect(page().sections).toEqual([{ type: 'upcoming', gameIds: ['2', '1'] }]);
});

it('replaces every page and its freshness on a catalog revision', async () => {
  showMain();
  await settle();
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 2, catalog, games: [second] });
  navigation().select('tennis');
  await settle();
  expect(useSportsStore.getState().results.live).toBeUndefined();

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 2, catalog, games: [first] });
  navigation().select('live');
  await settle();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(2);
});

it('admits catalogs and Games together, retaining equal revisions and rejecting incomplete or older responses', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValueOnce({ catalogRevision: 2, catalog: undefined, games: [first] });
  showMain();
  await settle();
  expect(useSportsStore.getState().catalog).toBeUndefined();
  expect(useSportsStore.getState().games).toEqual({});
  expect(status()).toBe('error');

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 2, catalog, games: [first] });
  await retrySportsPage('main');
  const acceptedCatalog = useSportsStore.getState().catalog;
  const updated = game('1', { clock: '12:00' });
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 2, catalog: undefined, games: [updated] });
  await refreshSportsPage('main');
  expect(useSportsStore.getState().catalog).toBe(acceptedCatalog);
  expect(useSportsStore.getState().games['1']?.clock).toBe('12:00');
  expect(jest.mocked(sportsClient.getLiveGames).mock.lastCall?.[0].knownCatalogRevision).toBe(2);

  const before = useSportsStore.getState();
  for (const response of [
    { catalogRevision: 1, catalog, games: [second] },
    { catalogRevision: 3, catalog: undefined, games: [second] },
  ]) {
    jest.mocked(sportsClient.getLiveGames).mockResolvedValue(response);
    await refreshSportsPage('main');
    expect(useSportsStore.getState().catalog).toBe(before.catalog);
    expect(useSportsStore.getState().games).toBe(before.games);
    expect(useSportsStore.getState().results).toBe(before.results);
    expect(page().sections[0]?.gameIds).toEqual(['1']);
    expect(status()).toBe('error');
  }
});

// ============ Days =========================================================== //

it('keys scheduled reads by all three boundaries and Search by its week alone', () => {
  const window = getSportsWindow(new Date(2026, 8, 20));
  const changed = { ...window, todayUntil: new Date(Date.parse(window.todayUntil) + time.hours(1)).toISOString() };

  expect(getPageQueryKey({ type: 'scope', scopeId: 'nba', window })).not.toBe(
    getPageQueryKey({ type: 'scope', scopeId: 'nba', window: changed })
  );
  expect(getPageQueryKey({ type: 'search', query: 'team', window })).toBe(
    getPageQueryKey({ type: 'search', query: 'team', window: changed })
  );
});

it('shows the new day at midnight and requests the new week', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59, 30));
  const later = game('tomorrow', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 21, 16).toISOString() });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [later] });
  navigation().select('nba');
  showMain();
  await settle();
  expect(page().sections).toEqual([{ type: 'upcoming', gameIds: ['tomorrow'] }]);

  jest.mocked(sportsClient.getGames).mockImplementation(pending);
  jest.advanceTimersByTime(time.seconds(30));
  await settle();

  expect(page().sections).toEqual([{ type: 'today', gameIds: ['tomorrow'] }]);
  expect(jest.mocked(sportsClient.getGames).mock.calls.map(([request]) => request.from)).toEqual([
    getSportsWindow(new Date(2026, 8, 20)).from,
    getSportsWindow(new Date(2026, 8, 21)).from,
  ]);
  expect(jest.mocked(sportsClient.getGames).mock.calls.map(([request]) => request.todayUntil)).toEqual([
    getSportsWindow(new Date(2026, 8, 20)).todayUntil,
    getSportsWindow(new Date(2026, 8, 21)).todayUntil,
  ]);
});

it('shows a scope as loading, not empty, while its new week loads', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59, 30));
  const tonight = game('tonight', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 20, 23, 59, 50).toISOString() });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [tonight] });
  navigation().select('nba');
  showMain();
  await settle();
  expect(page().sections).toEqual([{ type: 'today', gameIds: ['tonight'] }]);

  jest.mocked(sportsClient.getGames).mockImplementation(pending);
  jest.advanceTimersByTime(time.seconds(30));
  await settle();

  expect(page().sections).toEqual([]);
  expect(status()).toBe('loading');
});

it('requests only the current week when the app returns on a later day', async () => {
  await startClock(new Date(2026, 8, 20, 22));
  navigation().select('nba');
  showMain();
  await settle();

  useAppStateStore.setState('background');
  jest.setSystemTime(new Date(2026, 8, 21, 8));
  useAppStateStore.setState('active');
  await settle();

  expect(jest.mocked(sportsClient.getGames).mock.calls.map(([request]) => request.from)).toEqual([
    getSportsWindow(new Date(2026, 8, 20)).from,
    getSportsWindow(new Date(2026, 8, 21)).from,
  ]);
  expect(jest.mocked(sportsClient.getGames).mock.calls.map(([request]) => request.todayUntil)).toEqual([
    getSportsWindow(new Date(2026, 8, 20)).todayUntil,
    getSportsWindow(new Date(2026, 8, 21)).todayUntil,
  ]);
});

it('keeps event resolutions and Live across midnight', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59));
  openEvent('child');
  await settle();
  showMain();
  await settle();

  jest.advanceTimersByTime(time.minutes(1));
  await settle();

  expect(getGameId(useSportsStore.getState(), 'child')).toBe('1');
  expect(useSportsStore.getState().results.live?.gameIds).toEqual(new Set(['1']));
});

// ============ Status ========================================================= //

it('reports each page’s own failure', async () => {
  showMain();
  await settle();
  jest.mocked(sportsClient.getGames).mockRejectedValue(new Error('Schedule unavailable'));
  navigation().select('tennis');
  await settle();
  expect(status()).toBe('error');

  navigation().select('live');
  await settle();
  expect(status()).toBe('none');
  expect(page().sections[0]?.gameIds).toEqual(['1']);
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
});

it('keeps a page’s failure and retries its own request while another request is active', async () => {
  showMain();
  await settle();
  jest.mocked(sportsClient.getGames).mockRejectedValueOnce(new Error('Schedule unavailable'));
  navigation().select('tennis');
  await settle();
  openEvent('child');
  await settle();
  expect(status()).toBe('error');

  await retrySportsPage('main');
  expect(status()).toBe('none');
  expect(sportsClient.getGames).toHaveBeenCalledTimes(2);
  expect(sportsClient.lookupGames).toHaveBeenCalledTimes(1);
});

it('drops a failed request no page shows with the next response', async () => {
  showMain();
  await settle();
  jest.mocked(sportsClient.searchGames).mockRejectedValue(new Error('Offline'));
  for (const query of ['first', 'second']) {
    navigation().search(query);
    await settle();
  }

  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first] });
  navigation().search('third');
  await settle();

  const { queryCache } = useSportsStore.getState();
  expect(Object.values(queryCache).filter(entry => entry?.errorInfo)).toEqual([]);
  expect(status()).toBe('none');
});

it('releases a hidden page’s failure once midnight changes its request', async () => {
  await startClock(new Date(2026, 8, 20, 23, 57));
  showMain();
  await settle();
  jest.mocked(sportsClient.getGames).mockRejectedValue(new Error('Offline'));
  navigation().select('nba');
  await settle();
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  openEvent('1');
  await settle();

  await jest.advanceTimersByTimeAsync(time.minutes(4));
  await settle();
  expect(Object.values(useSportsStore.getState().queryCache).filter(entry => entry?.errorInfo)).toHaveLength(0);
});

it('releases abandoned failures even when every request fails', async () => {
  showMain();
  await settle();
  jest.mocked(sportsClient.searchGames).mockRejectedValue(new Error('Offline'));

  for (const query of ['first', 'second', 'third']) {
    navigation().search(query);
    await settle();
  }

  const failed = Object.values(useSportsStore.getState().queryCache).filter(entry => entry?.errorInfo);
  expect(failed).toHaveLength(1);
  expect(status()).toBe('error');
});

it('preserves another host’s current failure during a failure-only sequence', async () => {
  showMain();
  await settle();
  jest.mocked(sportsClient.searchGames).mockRejectedValue(new Error('Offline'));
  navigation().search('main query');
  await settle();

  showPredictions();
  for (const query of ['old query', 'current query']) {
    navigation('predictions').search(query);
    await settle();
  }

  const failed = Object.values(useSportsStore.getState().queryCache).filter(entry => entry?.errorInfo);
  expect(failed).toHaveLength(2);
  expect(status('main')).toBe('error');
  expect(status('predictions')).toBe('error');

  await retrySportsPage('main');
  expect(jest.mocked(sportsClient.searchGames).mock.lastCall?.[0].query).toBe('main query');
});

it('keeps a page’s sections when its refresh fails', async () => {
  showMain();
  await settle();

  const before = page().sections;
  const selectGames = jest.spyOn(sections, 'selectSportsGames');
  jest.mocked(sportsClient.getLiveGames).mockRejectedValue(new Error('Refresh failed'));
  await refreshSportsPage('main');
  await settle();

  expect(status()).toBe('error');
  expect(page().sections).toBe(before);
  expect(selectGames).not.toHaveBeenCalled();
});

it('returns to Live when retrying a category removed from the catalog', async () => {
  navigation().select('nba');
  jest.mocked(sportsClient.getGames).mockRejectedValue(new RainbowFetchError({ message: 'Scope removed', responseBody: { code: 5 } }));
  showMain();
  await settle();
  await retrySportsPage('main');
  await settle();

  expect(navigation().destination).toBe('live');
  expect(page().sections[0]?.gameIds).toEqual(['1']);
});

// ============ Search ========================================================= //

it('accumulates Search to thirty and refreshes from the first page', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: Array.from({ length: 20 }, (_, i) => game(`${i}`)), nextCursor: 'page-2' })
    .mockResolvedValueOnce({
      catalogRevision: 1,
      catalog,
      games: Array.from({ length: 20 }, (_, i) => game(`${i + 15}`)),
      nextCursor: 'page-3',
    });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');

  expect(jest.mocked(sportsClient.searchGames).mock.calls[1][0].cursor).toBe('page-2');
  expect(page().sections[0]?.gameIds).toHaveLength(30);
  expect(Object.keys(useSportsStore.getState().games)).toHaveLength(30);
  expect(status()).toBe('none');

  await loadMoreSportsGames('main');
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(2);

  await refreshSportsPage('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls[2][0].cursor).toBeUndefined();
  expect(page().sections[0]?.gameIds).toEqual(['1']);
});

it('continues across Search pages that repeat Games but advance the cursor', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second] });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');

  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.cursor)).toEqual([undefined, 'page-2', 'page-3']);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
  expect(status()).toBe('none');
});

it('rejects a Search cursor cycle without replacing loaded data and can retry', async () => {
  const updated = game('1', { clock: '12:00' });
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updated], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updated], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updated], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updated], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second] });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  const before = useSportsStore.getState();

  await refreshSportsPage('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.cursor)).toEqual([
    undefined,
    'page-2',
    undefined,
    'page-2',
    'page-3',
  ]);
  expect(useSportsStore.getState().games).toBe(before.games);
  expect(useSportsStore.getState().search).toBe(before.search);
  expect(status()).toBe('error');

  await retrySportsPage('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls[5][0].cursor).toBeUndefined();
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
  expect(useSportsStore.getState().games['1']?.clock).toBe('12:00');
  expect(status()).toBe('none');
});

it('refreshes the loaded Search range every minute without polling its continuation', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  const continuation = Promise.withResolvers<SearchGamesResponse>();
  const updatedFirst = game('1', { clock: '12:00' });
  const updatedSecond = game('2', { clock: '12:00' });
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updatedFirst], nextCursor: 'new-page-2' })
    .mockImplementationOnce(() => continuation.promise)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updatedFirst], nextCursor: 'new-page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updatedSecond], nextCursor: 'new-page-3' });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  const before = page().sections;

  jest.advanceTimersByTime(time.seconds(60) - 1);
  await settle();
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(2);

  jest.advanceTimersByTime(1);
  await settle();
  expect(page().sections).toBe(before);
  expect(useSportsStore.getState().games['1']?.clock).toBe(first.clock);

  continuation.resolve({ catalogRevision: 1, catalog, games: [updatedSecond], nextCursor: 'new-page-3' });
  await settle();
  expect(page().sections).toBe(before);
  expect(useSportsStore.getState().games['1']?.clock).toBe('12:00');
  expect(useSportsStore.getState().games['2']?.clock).toBe('12:00');

  jest.advanceTimersByTime(time.seconds(60));
  await settle();
  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.cursor)).toEqual([
    undefined,
    'page-2',
    undefined,
    'new-page-2',
    undefined,
    'new-page-2',
  ]);
});

it('keeps all Search data when a refresh fails and retries the loaded range', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  const updated = game('1', { clock: '12:00' });
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updated], nextCursor: 'page-2' })
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [updated], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second] });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  const before = useSportsStore.getState();

  jest.advanceTimersByTime(time.seconds(60));
  await settle();
  expect(useSportsStore.getState().games).toBe(before.games);
  expect(useSportsStore.getState().search).toBe(before.search);
  expect(status()).toBe('error');

  await retrySportsPage('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.cursor)).toEqual([
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
  const refresh = Promise.withResolvers<SearchGamesResponse>();
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockImplementationOnce(() => refresh.promise)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second] });
  navigation().search('team');
  showMain();
  await settle();
  const before = page().sections;

  jest.advanceTimersByTime(time.seconds(60));
  await settle();
  const loading = loadMoreSportsGames('main');
  expect(page().sections).toBe(before);
  refresh.resolve({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' });
  await loading;

  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.cursor)).toEqual([undefined, undefined, 'page-2']);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
});

it('restarts a paginated Search at midnight even when it is still fresh', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59, 30));
  navigation().search('team');
  showMain();
  await settle();
  jest.mocked(sportsClient.searchGames).mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second], nextCursor: 'page-3' });
  await loadMoreSportsGames('main');
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);

  openEvent('child');
  await settle();
  showMain();
  await settle();
  jest.advanceTimersByTime(time.seconds(30) - 1);
  await settle();
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(2);

  jest.advanceTimersByTime(1);
  await settle();
  const calls = jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request);
  expect(calls).toHaveLength(3);
  expect(calls[2].cursor).toBeUndefined();
  expect(calls[2].from).toBe(getSportsWindow(new Date(2026, 8, 21)).from);
});

it('keeps only the latest query’s results and loads a replaced query again when revisited', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockImplementation(async ({ query }) => ({ catalogRevision: 1, catalog, games: [query === 'first' ? first : second] }));
  navigation().search('first');
  showMain();
  await settle();
  navigation().search('second');
  await settle();
  expect(page().sections[0]?.gameIds).toEqual(['2']);
  expect(useSportsStore.getState().games['1']).toBeUndefined();

  navigation().search('first');
  await settle();
  expect(page().sections[0]?.gameIds).toEqual(['1']);
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(3);
});

it('searches again for a host whose Search result another host replaced', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockImplementation(async ({ query }) => ({ catalogRevision: 1, catalog, games: [query === 'first' ? first : second] }));
  navigation().search('first');
  showMain();
  await settle();
  navigation('predictions').search('second');
  showPredictions();
  await settle();

  showMain();
  await settle();
  expect(page().sections[0]?.gameIds).toEqual(['1']);
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(3);
});

it('searches globally from a category and returns to it on cancel', async () => {
  navigation().select('tennis');
  showMain();
  await settle();
  navigation().search('  NBA  ');
  await settle();

  const request = jest.mocked(sportsClient.searchGames).mock.calls[0][0];
  expect(request.query).toBe('NBA');
  expect(request.scopeId).toBeUndefined();
  expect(page().page).toBe('search');

  navigation().search(null);
  await settle();
  expect(navigation().destination).toBe('tennis');
  expect(page().sections[0]?.gameIds).toEqual(['2']);
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
});

it('retries a failed continuation without discarding earlier pages', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [second], nextCursor: 'page-3' })
    .mockRejectedValueOnce(new Error('Page unavailable'))
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [game('3')], nextCursor: undefined });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  await loadMoreSportsGames('main');
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
  expect(status()).toBe('error');

  await retrySportsPage('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([call]) => call.cursor)).toEqual([undefined, 'page-2', 'page-3', 'page-3']);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2', '3']);
});

it('keeps Search relevance order', async () => {
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [game('3'), first, second] });
  navigation().search('team');
  showMain();
  await settle();

  expect(page().sections).toEqual([{ type: 'search', gameIds: ['3', '1', '2'] }]);
});

it('retains the first Search page’s catalog when later refresh pages omit it', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog: undefined, games: [second] })
    .mockResolvedValueOnce({ catalogRevision: 2, catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 2, catalog: undefined, games: [second] });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  await refreshSportsPage('main');

  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.knownCatalogRevision)).toEqual([undefined, 1, 1, 2]);
  expect(useSportsStore.getState().catalog?.revision).toBe(2);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
  expect(status()).toBe('none');
});

it('restarts one rejected continuation without publishing abandoned data or an error footer', async () => {
  const restart = Promise.withResolvers<SearchGamesResponse>();
  const invalidCursor = new RainbowFetchError({ message: 'Invalid cursor', responseBody: { code: 9 } });
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 1, catalog: undefined, games: [second], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 2, catalog, games: [game('abandoned')], nextCursor: 'page-2' })
    .mockRejectedValueOnce(invalidCursor)
    .mockImplementationOnce(() => restart.promise)
    .mockResolvedValueOnce({ catalogRevision: 3, catalog: undefined, games: [game('new-2')], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 3, catalog: undefined, games: [] });
  navigation().search('team');
  showMain();
  await settle();
  await loadMoreSportsGames('main');
  const before = useSportsStore.getState();
  const footer = jest.fn();
  unsubscribes.push(sportsPageStatusStores.main.subscribe(footer));

  const refresh = refreshSportsPage('main');
  await settle();
  expect(useSportsStore.getState().catalog).toBe(before.catalog);
  expect(useSportsStore.getState().games).toBe(before.games);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
  expect(status()).toBe('more');
  expect(footer).not.toHaveBeenCalled();

  const more = loadMoreSportsGames('main');
  restart.resolve({ catalogRevision: 3, catalog, games: [game('new-1')], nextCursor: 'page-2' });
  await Promise.all([refresh, more]);

  const calls = jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request);
  expect(calls.map(request => request.cursor)).toEqual([undefined, 'page-2', undefined, 'page-2', undefined, 'page-2', 'page-3']);
  expect(calls.map(request => request.knownCatalogRevision)).toEqual([undefined, 1, 1, 2, 1, 3, 3]);
  expect(new Set(calls.map(request => `${request.query}/${request.from}/${request.until}`)).size).toBe(1);
  expect(useSportsStore.getState().catalog?.revision).toBe(3);
  expect(page().sections[0]?.gameIds).toEqual(['new-1', 'new-2']);
  expect(Object.keys(useSportsStore.getState().games).sort()).toEqual(['new-1', 'new-2']);
  expect(status()).toBe('none');
  expect(useSportsStore.getState().search?.requestedCount).toBe(3);

  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 3, catalog: undefined, games: [game('new-1')], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalogRevision: 3, catalog: undefined, games: [game('new-2')], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalogRevision: 3, catalog: undefined, games: [game('new-3')] });
  await refreshSportsPage('main');
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(10);
  expect(page().sections[0]?.gameIds).toEqual(['new-1', 'new-2', 'new-3']);
});

it('keeps committed Search data when a second continuation fails', async () => {
  const invalidCursor = new RainbowFetchError({ message: 'Invalid cursor', responseBody: { code: 9 } });
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalogRevision: 1, catalog, games: [first], nextCursor: 'page-2' })
    .mockRejectedValueOnce(invalidCursor)
    .mockResolvedValueOnce({ catalogRevision: 2, catalog, games: [second], nextCursor: 'page-2' })
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

it('does not restart a failed-precondition response to an initial Search request', async () => {
  jest.mocked(sportsClient.searchGames).mockRejectedValue(new RainbowFetchError({ message: 'Rejected', responseBody: { code: 9 } }));
  navigation().search('team');
  showMain();
  await settle();

  expect(sportsClient.searchGames).toHaveBeenCalledTimes(1);
  expect(status()).toBe('error');
});

it('does not restart a canceled Search continuation', async () => {
  navigation().search('team');
  showMain();
  await settle();
  const before = useSportsStore.getState();
  jest.mocked(sportsClient.searchGames).mockImplementationOnce(async (_, controller) => {
    controller?.abort();
    throw new RainbowFetchError({ message: 'Invalid cursor', responseBody: { code: 9 } });
  });
  await loadMoreSportsGames('main');

  expect(sportsClient.searchGames).toHaveBeenCalledTimes(2);
  expect(useSportsStore.getState().games).toBe(before.games);
  expect(page().sections[0]?.gameIds).toEqual(['1']);
});

it('rejects a Search continuation with a different revision instead of mixing its Games', async () => {
  navigation().search('team');
  showMain();
  await settle();
  const before = useSportsStore.getState();
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalogRevision: 2, catalog, games: [second] });
  await loadMoreSportsGames('main');

  expect(useSportsStore.getState().catalog).toBe(before.catalog);
  expect(useSportsStore.getState().games).toBe(before.games);
  expect(page().sections[0]?.gameIds).toEqual(['1']);
  expect(status()).toBe('error');
});

// ============ Events ========================================================= //

it('does not fetch or poll Sports for Discover', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  showMain();
  await settle();

  const { setList } = discoverEventListsStore.getState();
  setList('for_you', 'cards', ['child']);
  setList('crypto', 'cards', ['unsupported']);
  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
  await settle();

  useDiscoverNavigationStore.getState().navigate('crypto');
  setList('crypto', 'cards', ['unsupported', 'child']);
  await settle();
  useDiscoverSearchQueryStore.setState({ isSearching: true });
  await settle();
  useDiscoverSearchQueryStore.setState({ isSearching: false });
  await settle();
  await jest.advanceTimersByTimeAsync(time.minutes(2));

  expect(sportsRequestStore.getState()).toBeNull();
  expect(useSportsStore.getState().enabled).toBe(false);
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
  expect(sportsClient.getCatalog).not.toHaveBeenCalled();
  expect(sportsClient.getGames).not.toHaveBeenCalled();
  expect(sportsClient.searchGames).not.toHaveBeenCalled();
  expect(sportsClient.lookupGames).not.toHaveBeenCalled();
});

it('looks up the selected event while the event screen is active', async () => {
  showMain();
  await settle();
  openEvent('child');
  await settle();

  expect(lookedUpEventIds()).toEqual([['child']]);
  expect(useSportsStore.getState().getGame('child')?.id).toBe('1');
});

it('opens a game a page just returned without looking it up', async () => {
  showMain();
  await settle();
  openEvent('1');
  await settle();

  expect(sportsClient.lookupGames).not.toHaveBeenCalled();
  expect(useSportsStore.getState().getGame('1')?.id).toBe('1');
});

it('opens a game Search just returned without looking it up', async () => {
  navigation().search('team');
  showMain();
  await settle();
  openEvent('1');
  await settle();

  expect(sportsClient.lookupGames).not.toHaveBeenCalled();
});

it('opens the game another event just resolved to without looking it up', async () => {
  openEvent('child');
  await settle();
  openEvent('1');
  await settle();

  expect(lookedUpEventIds()).toEqual([['child']]);
});

it('dates a game’s answer by its latest delivery, and a resolved event’s by its own lookup', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  openEvent('child');
  await settle();
  useNavigationStore.setState({ activeRoute: Routes.WALLET_SCREEN });
  jest.advanceTimersByTime(time.seconds(50));
  showMain();
  await settle();

  jest.advanceTimersByTime(time.seconds(15));
  openEvent('1');
  await settle();
  expect(lookedUpEventIds()).toEqual([['child']]);

  openEvent('child');
  await settle();
  expect(lookedUpEventIds()).toEqual([['child'], ['child']]);
});

it('releases an unselected event’s game, answer, and timestamp with the next response', async () => {
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  openEvent('2');
  await settle();

  polymarketEventIdStore.setState({ eventId: null });
  showMain();
  await settle();

  const { answeredAt, eventGameIds, games } = useSportsStore.getState();
  expect(Object.keys(games)).toEqual(['1']);
  expect(eventGameIds).toEqual({});
  expect([...answeredAt.keys()]).toEqual(['1']);
});

it('looks up an event again once its answer was released', async () => {
  openEvent('child');
  await settle();
  polymarketEventIdStore.setState({ eventId: null });
  showMain();
  await settle();

  openEvent('child');
  await settle();
  expect(lookedUpEventIds()).toEqual([['child'], ['child']]);
});

it('retains the selected event’s Game without retaining Games for Discover lists', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [second] });
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  showMain();
  await settle();
  discoverEventListsStore.getState().setList('for_you', 'cards', ['2']);
  openEvent('3');
  await settle();

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first] });
  await refreshSportsPage('main');

  expect(Object.keys(useSportsStore.getState().games).sort()).toEqual(['1', '3']);
});

it('preserves unchanged Game and resolution identities through event polling', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  openEvent('1');
  await settle();
  const before = useSportsStore.getState();

  for (let poll = 0; poll < 3; poll++) {
    jest.advanceTimersByTime(time.minutes(1));
    await settle();
  }

  const after = useSportsStore.getState();
  expect(after.games).toBe(before.games);
  expect(after.eventGameIds).toBe(before.eventGameIds);
  expect(after.results).toBe(before.results);
  expect(after.answeredAt.get('1')).toBe(Date.now());
  expect(after.answeredAt.get('1')).toBeGreaterThan(before.answeredAt.get('1') ?? 0);
});

it('releases a formerly selected event’s answer with the next response', async () => {
  showMain();
  await settle();
  openEvent('child');
  await settle();
  expect(getGameId(useSportsStore.getState(), 'child')).toBe('1');

  openEvent('1');
  await settle();
  showMain();
  await refreshSportsPage('main');

  expect(getGameId(useSportsStore.getState(), 'child')).toBeUndefined();
  expect(lookedUpEventIds()).toEqual([['child']]);
});

it('releases a game with the page response that no longer shows it', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first, game('3')] });
  showMain();
  await settle();
  expect(Object.keys(useSportsStore.getState().games).sort()).toEqual(['1', '3']);

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [first] });
  await refreshSportsPage('main');
  expect(Object.keys(useSportsStore.getState().games)).toEqual(['1']);
});

it('asks again about a resolved event a minute after each answer, even when the answer is unchanged', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  openEvent('child');
  await settle();

  for (let step = 0; step < 3; step++) {
    jest.advanceTimersByTime(time.seconds(30));
    await settle();
  }

  expect(lookedUpEventIds()).toEqual([['child'], ['child']]);
});

it('waits a minute before asking again about an event that stopped being a game', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  openEvent('1');
  await settle();

  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue({ catalogRevision: 1, catalog, games: [], resolved: [], unavailableEventIds: ['1'] });
  jest.advanceTimersByTime(time.minutes(1));
  await settle();
  expect(getGameId(useSportsStore.getState(), '1')).toBeNull();
  expect(useSportsStore.getState().games).toEqual({});

  jest.advanceTimersByTime(time.minutes(1) - 1);
  await settle();
  expect(lookedUpEventIds()).toEqual([['1'], ['1']]);
});

it('resolves an event reported unavailable once its game arrives, and keeps the game for it', async () => {
  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue({ catalogRevision: 1, catalog, games: [], resolved: [], unavailableEventIds: ['1'] });
  openEvent('1');
  await settle();
  expect(getGameId(useSportsStore.getState(), '1')).toBeNull();

  showMain();
  await settle();
  expect(getGameId(useSportsStore.getState(), '1')).toBe('1');

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [second] });
  await refreshSportsPage('main');
  expect(page().sections[0]?.gameIds).toEqual(['2']);
  expect(useSportsStore.getState().getGame('1')?.id).toBe('1');
});

it('pauses while the app is inactive and resumes on return', async () => {
  useAppStateStore.setState('background');
  showMain();
  await settle();
  expect(sportsClient.getLiveGames).not.toHaveBeenCalled();

  useAppStateStore.setState('active');
  await settle();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
});

// ============ Navigation ===================================================== //

it('keeps the category tab while browsing into it and Back returns through its parents', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalogRevision: 1, catalog, games: [] });
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

it('does not publish when an unchanged destination is selected again', () => {
  const listener = jest.fn();
  const unsubscribe = sportsNavigationStores.main.subscribe(listener);

  navigation().select('live');
  navigation().open('live');
  navigation().search(null);
  expect(listener).not.toHaveBeenCalled();

  navigation().search('');
  navigation().select('live');
  expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe();
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
