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
  getGame,
  getGameId,
  loadMoreSportsGames,
  refreshSportsEvents,
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
  revision: 1,
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

function lookupEvents({ eventIds }: { eventIds: string[] }) {
  return Promise.resolve(lookupResponse(eventIds.map(id => game(id))));
}

function lookupResponse(games: Game[], resolved = games.map(game => ({ eventId: game.id, gameId: game.id }))): LookupGamesResponse {
  return {
    catalog,
    games,
    resolved,
    unavailableEventIds: [],
  };
}

function page(host: 'main' | 'predictions' = 'main') {
  return sportsPageStores[host].getState();
}

function status(host: 'main' | 'predictions' = 'main') {
  return sportsPageStatusStores[host].getState();
}

function navigation(host: 'main' | 'predictions' = 'main') {
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

function showDiscover(): void {
  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
}

/**
 * Sets the events a list in a Discover section shows, in the active section unless another is given.
 */
function setList(eventIds: string[], section = useDiscoverNavigationStore.getState().activeSection, listId = 'list'): void {
  discoverEventListsStore.getState().setList(section, listId, eventIds);
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
  for (const host of ['main', 'predictions'] as const)
    sportsNavigationStores[host].setState(sportsNavigationStores[host].getInitialState());
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
  jest.mocked(sportsClient.getCatalog).mockReset().mockResolvedValue(catalog);
  jest
    .mocked(sportsClient.getLiveGames)
    .mockReset()
    .mockResolvedValue({ catalog, games: [first] });
  jest
    .mocked(sportsClient.getGames)
    .mockReset()
    .mockResolvedValue({ catalog, games: [second] });
  jest
    .mocked(sportsClient.searchGames)
    .mockReset()
    .mockImplementation(async ({ cursor }) => ({ catalog, games: cursor ? [] : [first], nextCursor: cursor ? undefined : 'page-2' }));
  jest
    .mocked(sportsClient.lookupGames)
    .mockReset()
    .mockResolvedValue({ catalog, games: [first], resolved: [{ eventId: 'child', gameId: '1' }], unavailableEventIds: ['unsupported'] });

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
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [updated] });
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

it('caps ordered browse responses without repeating eligibility or ranking', async () => {
  const games = Array.from({ length: 40 }, (_, index) => game(String(index).padStart(2, '0')));
  const selectGames = jest.spyOn(sections, 'selectSportsGames');
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games });
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

it('computes a page’s cache key when its request changes, not on each update', async () => {
  showMain();
  await settle();

  const stringify = jest.spyOn(JSON, 'stringify');
  for (let value = 1; value <= 3; value++) {
    useSportsStore.setState(state => ({ games: { ...state.games, '1': game('1', { score: [{ ...first.score[0], first: { value } }] }) } }));
  }
  const keyBuilds = stringify.mock.calls.filter(([input]) => typeof input === 'object' && input !== null && 'request' in input);
  stringify.mockRestore();

  expect(keyBuilds).toHaveLength(0);
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

it('shows live games for a sport browsed by competition, loading the catalog first on a cold entry', async () => {
  navigation().select('soccer');
  showMain();
  await settle();

  expect(sportsClient.getCatalog).toHaveBeenCalledTimes(1);
  expect(sportsClient.getLiveGames).toHaveBeenCalledWith({ scopeId: 'soccer' }, expect.anything());
  expect(sportsClient.getGames).not.toHaveBeenCalled();
  expect(page()).toMatchObject({ page: 'competitions', directoryIds: ['epl'] });

  navigation().open('epl');
  await settle();
  expect(sportsClient.getGames).toHaveBeenCalledWith(expect.objectContaining({ scopeId: 'epl' }), expect.anything());
  expect(sportsClient.getCatalog).toHaveBeenCalledTimes(1);
});

it('discards an interrupted response instead of publishing it', async () => {
  const response = Promise.withResolvers<GetGamesResponse>();
  jest.mocked(sportsClient.getLiveGames).mockImplementationOnce(() => response.promise);
  showMain();
  await settle();
  navigation().select('tennis');
  await settle();
  response.resolve({ catalog, games: [first] });
  await settle();

  expect(page().sections[0]?.gameIds).toEqual(['2']);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});

it('caps each section at thirty and stores only the games its sections show', async () => {
  const today = getSportsWindow().from;
  const date = new Date(today);
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
  const live = Array.from({ length: 31 }, (_, i) => game(String(100 + i), { startsAt: today }));
  const scheduled = Array.from({ length: 31 }, (_, i) => game(String(200 + i), { status: Game_Status.STATUS_SCHEDULED, startsAt: today }));
  const upcoming = Array.from({ length: 31 }, (_, i) =>
    game(String(300 + i), { status: Game_Status.STATUS_SCHEDULED, startsAt: tomorrow })
  );
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [...live, ...scheduled, ...upcoming] });
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

it('caps each Live group at thirty', async () => {
  const basketball = Array.from({ length: 31 }, (_, i) => game(String(100 + i)));
  const tennis = Array.from({ length: 31 }, (_, i) => game(String(200 + i), { competitionIds: ['atp'] }));
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [...basketball, ...tennis] });
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
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [scheduled] });
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
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [first, second] });
  jest
    .mocked(sportsClient.getGames)
    .mockImplementation(({ scopeId }) => Promise.resolve({ catalog, games: scopeId === 'nba' ? [first] : [second] }));
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
  await refreshSportsEvents();

  expect(selectGames).toHaveBeenCalledTimes(2);
  expect(useSportsStore.getState().results.nba?.sections).toEqual([]);
  expect(useSportsStore.getState().results.live?.sections).toEqual([{ type: 'live', scopeId: 'atp', gameIds: ['2'] }]);
  expect(useSportsStore.getState().results.tennis).toBe(tennis);
});

it('keeps score polls off page Game comparisons after a status change', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [first, second] });
  jest.mocked(sportsClient.lookupGames).mockResolvedValue(lookupResponse([first, second]));
  showMain();
  await settle();
  setList(['1', '2']);
  showDiscover();
  await settle();

  const finished = { ...first, status: Game_Status.STATUS_ENDED };
  jest.mocked(sportsClient.lookupGames).mockResolvedValue(lookupResponse([finished, second]));
  await refreshSportsEvents();
  const compareGames = jest.spyOn(sections, 'areSectionInputsEqual');

  const scored = game('2', { competitionIds: ['atp'], score: [{ ...second.score[0], first: { value: 1 } }] });
  jest.mocked(sportsClient.lookupGames).mockResolvedValue(lookupResponse([finished, scored]));
  await refreshSportsEvents();
  expect(compareGames).not.toHaveBeenCalled();
});

it('reuses stored sections after the page remounts and refreshes', async () => {
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [first] });
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
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [scored] });
  await refreshSportsPage('main');
  expect(compareGames).not.toHaveBeenCalled();
});

it('removes a game from a page when any response moves it out of the page’s scope', async () => {
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [first] });
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
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [early, late] });
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
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog: { ...catalog, revision: 2 }, games: [second] });
  navigation().select('tennis');
  await settle();
  expect(useSportsStore.getState().results.live).toBeUndefined();

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog: { ...catalog, revision: 2 }, games: [first] });
  navigation().select('live');
  await settle();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(2);
});

// ============ Days =========================================================== //

it('shows the new day at midnight and requests the new week', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59, 30));
  const later = game('tomorrow', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 21, 16).toISOString() });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [later] });
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
});

it('shows a scope as loading, not empty, while its new week loads', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59, 30));
  const tonight = game('tonight', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 20, 23, 59, 50).toISOString() });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [tonight] });
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
});

it('keeps event resolutions and Live across midnight', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59));
  setList(['child']);
  showDiscover();
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

  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [first] });
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
  setList(['1']);
  showDiscover();
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
    .mockResolvedValueOnce({ catalog, games: Array.from({ length: 20 }, (_, i) => game(`${i}`)), nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: Array.from({ length: 20 }, (_, i) => game(`${i + 15}`)), nextCursor: 'page-3' });
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
    .mockResolvedValueOnce({ catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [first], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalog, games: [second] });
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
    .mockResolvedValueOnce({ catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [second], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalog, games: [updated], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [updated], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalog, games: [updated], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [updated], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [second] });
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
    .mockResolvedValueOnce({ catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [second], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalog, games: [updatedFirst], nextCursor: 'new-page-2' })
    .mockImplementationOnce(() => continuation.promise)
    .mockResolvedValueOnce({ catalog, games: [updatedFirst], nextCursor: 'new-page-2' })
    .mockResolvedValueOnce({ catalog, games: [updatedSecond], nextCursor: 'new-page-3' });
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

  continuation.resolve({ catalog, games: [updatedSecond], nextCursor: 'new-page-3' });
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
    .mockResolvedValueOnce({ catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [second], nextCursor: 'page-3' })
    .mockResolvedValueOnce({ catalog, games: [updated], nextCursor: 'page-2' })
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ catalog, games: [updated], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [second] });
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
    .mockResolvedValueOnce({ catalog, games: [first], nextCursor: 'page-2' })
    .mockImplementationOnce(() => refresh.promise)
    .mockResolvedValueOnce({ catalog, games: [second] });
  navigation().search('team');
  showMain();
  await settle();
  const before = page().sections;

  jest.advanceTimersByTime(time.seconds(60));
  await settle();
  const loading = loadMoreSportsGames('main');
  expect(page().sections).toBe(before);
  refresh.resolve({ catalog, games: [first], nextCursor: 'page-2' });
  await loading;

  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.cursor)).toEqual([undefined, undefined, 'page-2']);
  expect(page().sections[0]?.gameIds).toEqual(['1', '2']);
});

it('restarts a paginated Search at midnight even when it is still fresh', async () => {
  await startClock(new Date(2026, 8, 20, 23, 59, 30));
  navigation().search('team');
  showMain();
  await settle();
  jest.mocked(sportsClient.searchGames).mockResolvedValueOnce({ catalog, games: [second], nextCursor: 'page-3' });
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
  jest.mocked(sportsClient.searchGames).mockImplementation(async ({ query }) => ({ catalog, games: [query === 'first' ? first : second] }));
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
  jest.mocked(sportsClient.searchGames).mockImplementation(async ({ query }) => ({ catalog, games: [query === 'first' ? first : second] }));
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
    .mockResolvedValueOnce({ catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [second], nextCursor: 'page-3' })
    .mockRejectedValueOnce(new Error('Page unavailable'))
    .mockResolvedValueOnce({ catalog, games: [game('3')], nextCursor: undefined });
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
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [game('3'), first, second] });
  navigation().search('team');
  showMain();
  await settle();

  expect(page().sections).toEqual([{ type: 'search', gameIds: ['3', '1', '2'] }]);
});

it('restarts Search when its continuation is rejected', async () => {
  navigation().search('team');
  showMain();
  await settle();
  jest
    .mocked(sportsClient.searchGames)
    .mockRejectedValueOnce(new RainbowFetchError({ message: 'Invalid cursor', responseBody: { code: 9 } }));
  await loadMoreSportsGames('main');

  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog: { ...catalog, revision: 2 }, games: [second], nextCursor: undefined });
  await retrySportsPage('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls[2][0].cursor).toBeUndefined();
  expect(page().sections[0]?.gameIds).toEqual(['2']);
});

// ============ Events ========================================================= //

it('looks up the events that the active Discover section’s lists show', async () => {
  showMain();
  await settle();
  setList(['unsupported', 'child']);
  setList(['child', 'other'], 'crypto');
  await settle();
  expect(sportsClient.lookupGames).not.toHaveBeenCalled();

  showDiscover();
  await settle();
  expect(lookedUpEventIds()).toEqual([['child', 'unsupported']]);

  const state = useSportsStore.getState();
  expect(getGameId(state, 'child')).toBe('1');
  expect(getGameId(state, 'unsupported')).toBeNull();
  expect(getGameId(state, '1')).toBe('1');
  expect(getGameId(state, 'unknown')).toBeUndefined();

  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  useDiscoverNavigationStore.getState().navigate('crypto');
  await settle();
  expect(lookedUpEventIds()).toEqual([['child', 'unsupported'], ['other']]);
});

it('ignores the lists of Discover sections that are not active', async () => {
  setList(['child']);
  showDiscover();
  await settle();

  const listener = jest.fn();
  unsubscribes.push(sportsRequestStore.subscribe(listener));
  setList(['other'], 'crypto');
  setList(['another'], 'crypto', 'second-list');
  await settle();

  expect(listener).not.toHaveBeenCalled();
  expect(lookedUpEventIds()).toEqual([['child']]);
});

it('does not publish a request for overlapping lists or card reordering', async () => {
  setList(['1', '2']);
  showDiscover();
  await settle();

  const listener = jest.fn();
  unsubscribes.push(sportsRequestStore.subscribe(listener));
  setList(['2', '1']);
  setList(['2'], undefined, 'overlap');
  await settle();
  expect(listener).not.toHaveBeenCalled();

  setList([], undefined, 'list');
  await settle();
  expect(listener).toHaveBeenCalledTimes(1);
  expect(sportsRequestStore.getState()).toEqual({ type: 'events', route: Routes.DISCOVER_SCREEN, eventIds: ['2'] });
});

it('suspends Discover lookups behind Search without dropping retained games', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  setList(['1']);
  showDiscover();
  await settle();

  useDiscoverSearchQueryStore.setState({ isSearching: true });
  await settle();
  expect(sportsRequestStore.getState()).toBeNull();
  expect(getGame(useSportsStore.getState(), '1')?.id).toBe('1');

  await jest.advanceTimersByTimeAsync(time.seconds(30));
  useDiscoverSearchQueryStore.setState({ isSearching: false });
  await settle();
  expect(lookedUpEventIds()).toEqual([['1']]);

  useDiscoverSearchQueryStore.setState({ isSearching: true });
  await settle();
  await jest.advanceTimersByTimeAsync(time.seconds(40));
  expect(lookedUpEventIds()).toEqual([['1']]);

  useDiscoverSearchQueryStore.setState({ isSearching: false });
  await settle();
  expect(lookedUpEventIds()).toEqual([['1'], ['1']]);
});

it('looks up the selected event while the event screen is active', async () => {
  showMain();
  await settle();
  openEvent('child');
  await settle();

  expect(lookedUpEventIds()).toEqual([['child']]);
  expect(getGame(useSportsStore.getState(), 'child')?.id).toBe('1');
});

it('opens a game a page just returned without looking it up', async () => {
  showMain();
  await settle();
  openEvent('1');
  await settle();

  expect(sportsClient.lookupGames).not.toHaveBeenCalled();
  expect(getGame(useSportsStore.getState(), '1')?.id).toBe('1');
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

it('looks up only the events a changed list adds', async () => {
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  setList(['1', '2']);
  showDiscover();
  await settle();
  setList(['2', '3']);
  await settle();

  expect(lookedUpEventIds()).toEqual([['1', '2'], ['3']]);
});

it('releases the games, answers, and answer times of events nothing shows with the next response', async () => {
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  setList(['2', '3']);
  showDiscover();
  await settle();

  discoverEventListsStore.getState().removeList('for_you', 'list');
  showMain();
  await settle();

  const { answeredAt, eventGameIds, games } = useSportsStore.getState();
  expect(Object.keys(games)).toEqual(['1']);
  expect(eventGameIds).toEqual({});
  expect([...answeredAt.keys()]).toEqual(['1']);
});

it('looks up an event again once its answer was released', async () => {
  setList(['child']);
  showDiscover();
  await settle();
  discoverEventListsStore.getState().removeList('for_you', 'list');
  showMain();
  await settle();

  setList(['child']);
  showDiscover();
  await settle();
  expect(lookedUpEventIds()).toEqual([['child'], ['child']]);
});

it('keeps the games of lists in other Discover sections and of the selected event', async () => {
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  setList(['2']);
  showDiscover();
  await settle();
  openEvent('3');
  await settle();

  useDiscoverNavigationStore.getState().navigate('crypto');
  showMain();
  await settle();

  expect(Object.keys(useSportsStore.getState().games).sort()).toEqual(['1', '2', '3']);
});

it('does not traverse retention or cache ownership during stable event polling', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  setList(['1', '2']);
  showDiscover();
  await settle();

  const indices = new Set<object>();
  const caches = new Set<object>();
  const recordInputs = () => {
    const state = useSportsStore.getState();
    indices.add(state.games);
    indices.add(state.eventGameIds);
    caches.add(state.queryCache);
  };
  recordInputs();
  unsubscribes.push(useSportsStore.subscribe(recordInputs));

  const keys = jest.spyOn(Object, 'keys');
  const entries = jest.spyOn(Object, 'entries');
  const values = jest.spyOn(Object, 'values');
  const results = useSportsStore.getState().results;

  for (let poll = 0; poll < 10; poll++) {
    jest.setSystemTime(Date.now() + time.seconds(60));
    await useSportsStore.getState().fetch(undefined, { force: true });
    await settle();
  }

  expect(keys.mock.calls.filter(([value]) => indices.has(value))).toHaveLength(0);
  expect(entries.mock.calls.filter(([value]) => caches.has(value))).toHaveLength(0);
  expect(values.mock.calls.filter(([value]) => value === results)).toHaveLength(0);
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

it('releases a page-origin game after its last mounted list releases it', async () => {
  showMain();
  await settle();
  setList(['1']);
  showDiscover();
  await settle();
  expect(sportsClient.lookupGames).not.toHaveBeenCalled();

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [] });
  await refreshSportsPage('main');
  expect(getGame(useSportsStore.getState(), '1')?.id).toBe('1');

  setList([]);
  await refreshSportsPage('main');
  expect(useSportsStore.getState().games).toEqual({});
  expect(useSportsStore.getState().answeredAt.size).toBe(0);
});

it('releases a game with the page response that no longer shows it', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [first, game('3')] });
  showMain();
  await settle();
  expect(Object.keys(useSportsStore.getState().games).sort()).toEqual(['1', '3']);

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [first] });
  await refreshSportsPage('main');
  expect(Object.keys(useSportsStore.getState().games)).toEqual(['1']);
});

it('releases an event’s game once the event stops being a game', async () => {
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  openEvent('1');
  await settle();
  expect(getGame(useSportsStore.getState(), '1')?.id).toBe('1');

  jest.mocked(sportsClient.lookupGames).mockResolvedValue({ catalog, games: [], resolved: [], unavailableEventIds: ['1'] });
  await refreshSportsEvents();
  expect(useSportsStore.getState().games).toEqual({});
});

it('leaves event refresh idle outside an active event request', async () => {
  showMain();
  await settle();
  await refreshSportsEvents();
  expect(sportsClient.lookupGames).not.toHaveBeenCalled();

  openEvent('child');
  await settle();
  useAppStateStore.setState('background');
  await settle();
  await refreshSportsEvents();
  expect(sportsClient.lookupGames).toHaveBeenCalledTimes(1);
});

it('refreshes fresh events once and preserves unrelated receipts and the next poll', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  showMain();
  await settle();
  const pageReceipt = useSportsStore.getState().answeredAt.get('1');

  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  setList(['2', '3']);
  showDiscover();
  await settle();
  await jest.advanceTimersByTimeAsync(time.seconds(10));
  await refreshSportsEvents();
  await settle();
  expect(lookedUpEventIds()).toEqual([
    ['2', '3'],
    ['2', '3'],
  ]);
  expect(useSportsStore.getState().answeredAt.get('1')).toBe(pageReceipt);

  await jest.advanceTimersByTimeAsync(time.seconds(59));
  expect(lookedUpEventIds()).toHaveLength(2);
  await jest.advanceTimersByTimeAsync(time.seconds(1));
  expect(lookedUpEventIds()).toEqual([
    ['2', '3'],
    ['2', '3'],
    ['2', '3'],
  ]);
});

it('refreshes each event a minute after the server last answered for it', async () => {
  await startClock(new Date(2026, 8, 20, 12));
  jest.mocked(sportsClient.lookupGames).mockImplementation(lookupEvents);
  setList(['1', '2']);
  showDiscover();
  await settle();

  jest.advanceTimersByTime(time.seconds(30));
  setList(['1', '2', '3']);
  await settle();

  for (let step = 0; step < 2; step++) {
    jest.advanceTimersByTime(time.seconds(30));
    await settle();
  }

  expect(lookedUpEventIds()).toEqual([['1', '2'], ['3'], ['1', '2'], ['3']]);
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

  jest.mocked(sportsClient.lookupGames).mockResolvedValue({ catalog, games: [], resolved: [], unavailableEventIds: ['1'] });
  jest.advanceTimersByTime(time.minutes(1));
  await settle();
  expect(getGameId(useSportsStore.getState(), '1')).toBeNull();

  jest.advanceTimersByTime(time.minutes(1) - 1);
  await settle();
  expect(lookedUpEventIds()).toEqual([['1'], ['1']]);
});

it('resolves an event reported unavailable once its game arrives, and keeps the game for it', async () => {
  jest.mocked(sportsClient.lookupGames).mockResolvedValue({ catalog, games: [], resolved: [], unavailableEventIds: ['1'] });
  openEvent('1');
  await settle();
  expect(getGameId(useSportsStore.getState(), '1')).toBeNull();

  showMain();
  await settle();
  expect(getGameId(useSportsStore.getState(), '1')).toBe('1');

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [second] });
  await refreshSportsPage('main');
  expect(page().sections[0]?.gameIds).toEqual(['2']);
  expect(getGame(useSportsStore.getState(), '1')?.id).toBe('1');
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
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [] });
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
