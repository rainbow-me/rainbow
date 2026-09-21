import { Game, Game_Status, SportsCatalog, type GetGamesResponse } from '@/features/sports/core/generated/sports';
import * as sections from '@/features/sports/core/sections';
import { sportsClient } from '@/features/sports/data/api/client';
import { getSportsResult, sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
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
  sports: [
    { id: 'basketball', name: 'Basketball', browse: 'BROWSE_GAMES', competitions: [{ id: 'nba', name: 'NBA' }] },
    { id: 'tennis', name: 'Tennis', browse: 'BROWSE_GAMES', competitions: [{ id: 'atp', name: 'ATP' }] },
  ],
});
const owner = Symbol('detail');
const first = game('1');
const second = game('2', { competitionIds: ['atp'] });

function game(id: string, fields: Partial<Game> = {}): Game {
  return Game.fromJSON({
    id,
    competitionIds: ['nba'],
    status: Game_Status.STATUS_LIVE,
    participants: [{ name: 'First', winner: { eventId: id, marketId: 'market', tokenId: `${id}-a` } }, { name: 'Second' }],
    score: [{ kind: 'KIND_TOTAL', first: { value: 0 }, second: { value: 0 } }],
    ...fields,
  });
}

function result(host: 'main' | 'predictions' = 'main') {
  return getSportsResult(useSportsStore.getState(), useSportsViewStore.getState().hosts[host].request);
}

function settle(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

let stop: () => void;

beforeEach(() => {
  useSportsStore.getState().clear();
  useSportsViewStore.setState({ ...useSportsViewStore.getInitialState(), appActive: true });
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.mocked(sportsClient.getCatalog).mockResolvedValue(catalog);
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [first] });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [second] });
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [first], nextCursor: 'page-2' });
  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue({ catalog, games: [first], resolved: [{ eventId: 'child', gameId: '1' }], unavailableEventIds: ['unsupported'] });
  stop = useSportsStore.subscribe(() => undefined);
});

afterEach(() => {
  stop();
  sportsActions.setHostVisibility('main', false);
  sportsActions.setHostVisibility('predictions', false);
  sportsActions.removeLookupConsumer(owner);
});

afterAll(() => useSportsStore.getState().reset(true));

it.each(['browse', 'lookup'] as const)('%s score updates preserve atomic records without regrouping or recounting', async source => {
  stop();
  stop = useSportsStore.subscribe(state => {
    for (const result of Object.values(state.results)) {
      for (const id of result?.gameIds ?? []) expect(state.games[id]).toBeDefined();
    }
  });
  sportsActions.setHostVisibility('main', true);
  await settle();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await settle();

  if (source === 'browse') {
    sportsActions.selectDestination('main', { type: 'live' });
  } else {
    sportsActions.setLookupConsumer(owner, {
      route: Routes.POLYMARKET_EVENT_SCREEN,
      eventIds: ['child'],
      visibleIds: ['child'],
      active: true,
    });
    useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  }
  await settle();

  const before = useSportsStore.getState();
  const group = jest.spyOn(sections, 'getSportsSections');
  const count = jest.spyOn(sections, 'getSportsDirectoryCounts');
  const updated = game('1', { score: [{ ...first.score[0], first: { value: 1 } }] });
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [updated] });
  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [updated],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: [],
  });
  await useSportsStore.getState().fetch(undefined, { force: true });

  const after = useSportsStore.getState();
  expect(after.games['1']?.score).not.toEqual(before.games['1']?.score);
  expect(after.games['1']?.participants).toBe(before.games['1']?.participants);
  expect(after.games['1']?.participants[0].winner).toBe(before.games['1']?.participants[0].winner);
  expect(after.catalog).toBe(before.catalog);
  expect(after.results).toBe(before.results);
  expect(group).not.toHaveBeenCalled();
  expect(count).not.toHaveBeenCalled();
});

it('retains visited categories through hiding, unmounting, and a host handoff without another fresh read', async () => {
  sportsActions.setHostVisibility('main', true);
  await settle();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await settle();
  sportsActions.selectDestination('main', { type: 'live' });
  await settle();
  expect(result()?.sections[0].gameIds).toEqual(['1']);
  sportsActions.setHostVisibility('main', false);
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN });
  sportsActions.selectDestination('predictions', { type: 'scope', scopeId: 'tennis' });
  sportsActions.setHostVisibility('predictions', true);
  await settle();
  expect(result('predictions')?.sections[0].gameIds).toEqual(['2']);
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
});

it('discards an interrupted response rather than publishing it into a new destination', async () => {
  let complete!: (data: GetGamesResponse) => void;
  jest.mocked(sportsClient.getLiveGames).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve;
      })
  );
  sportsActions.setHostVisibility('main', true);
  await settle();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await settle();
  complete({ catalog, games: [first] });
  await settle();
  expect(result()?.sections[0].gameIds).toEqual(['2']);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});

it('uses the foreground route during overlapping registration effects', async () => {
  sportsActions.setLookupConsumer(owner, {
    route: Routes.POLYMARKET_EVENT_SCREEN,
    eventIds: ['child'],
    visibleIds: ['child'],
    active: true,
  });
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(sportsClient.lookupGames).not.toHaveBeenCalled();
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  await settle();
  expect(sportsClient.lookupGames).toHaveBeenCalledTimes(1);
  expect(useSportsStore.getState().eventGames).toEqual({ child: '1' });
  sportsActions.removeLookupConsumer(owner);
  expect(useSportsStore.getState().games['1']).toBeDefined();
});

it('caps each section independently and counts only retained browse games', async () => {
  const today = useSportsViewStore.getState().window.from;
  const date = new Date(today);
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
  const games = Array.from({ length: 31 }, (_, i) => game(`live-${i}`)).concat(
    Array.from({ length: 31 }, (_, i) => game(`today-${i}`, { status: Game_Status.STATUS_SCHEDULED, startsAt: today })),
    Array.from({ length: 31 }, (_, i) => game(`later-${i}`, { status: Game_Status.STATUS_SCHEDULED, startsAt: tomorrow }))
  );
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(result()?.sections.map(section => section.gameIds.length)).toEqual([30, 30, 30]);
  expect(Object.keys(useSportsStore.getState().games)).toHaveLength(90);
  expect(useSportsStore.getState().counts.nba).toBe(90);
});

it('caps each Live group independently', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({
    catalog,
    games: Array.from({ length: 31 }, (_, i) => game(`${i}`)).concat(
      Array.from({ length: 31 }, (_, i) => game(`tennis-${i}`, { competitionIds: ['atp'] }))
    ),
  });
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(result()?.sections.map(section => section.gameIds.length)).toEqual([30, 30]);
  expect(Object.keys(useSportsStore.getState().games)).toHaveLength(60);
});

it('accumulates Search once, stops at thirty, and refreshes from the first page', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalog, games: Array.from({ length: 20 }, (_, i) => game(`${i}`)), nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: Array.from({ length: 20 }, (_, i) => game(`${i + 15}`)), nextCursor: 'page-3' });
  sportsActions.setSearch('main', 'team');
  sportsActions.setHostVisibility('main', true);
  await settle();
  await sportsActions.loadMore('main');
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(2);
  expect(jest.mocked(sportsClient.searchGames).mock.calls[1][0].cursor).toBe('page-2');
  expect(result()?.sections[0].gameIds).toHaveLength(30);
  expect(result()?.nextCursor).toBeUndefined();
  await sportsActions.loadMore('main');
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(2);
  await sportsActions.refresh('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls[2][0].cursor).toBeUndefined();
  expect(result()?.sections[0].gameIds).toEqual(['1']);
});

it('returns the correct result when revisiting a search', async () => {
  jest.mocked(sportsClient.searchGames).mockImplementation(async ({ query }) => ({ catalog, games: [query === 'first' ? first : second] }));
  sportsActions.setSearch('main', 'first');
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(result()?.gameIds).toEqual(['1']);

  sportsActions.setSearch('main', 'second');
  await settle();
  expect(result()?.gameIds).toEqual(['2']);

  sportsActions.setSearch('main', 'first');
  await settle();
  expect(result()?.gameIds).toEqual(['1']);
});

it('invalidates old memberships and freshness together on a catalog revision', async () => {
  sportsActions.setHostVisibility('main', true);
  await settle();
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog: { ...catalog, revision: 2 }, games: [second] });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await settle();
  expect(useSportsStore.getState().results.live).toBeUndefined();
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
  sportsActions.selectDestination('main', { type: 'live' });
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog: { ...catalog, revision: 2 }, games: [first] });
  await settle();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(2);
});

it('does not attribute another request’s failure to a successfully cached category', async () => {
  sportsActions.setHostVisibility('main', true);
  await settle();
  jest.mocked(sportsClient.getGames).mockRejectedValue(new Error('Schedule unavailable'));
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await settle();
  expect(useSportsStore.getState().getCacheEntry()?.errorInfo?.error.message).toBe('Schedule unavailable');
  sportsActions.selectDestination('main', { type: 'live' });
  await settle();
  expect(result()?.sections[0].gameIds).toEqual(['1']);
  expect(useSportsStore.getState().getCacheEntry()?.errorInfo).toBeNull();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
});

it('can load another Search page after cancelling a different read and returning to cached Search', async () => {
  sportsActions.setSearch('main', 'team');
  sportsActions.setHostVisibility('main', true);
  await settle();
  let complete!: (data: GetGamesResponse) => void;
  jest.mocked(sportsClient.getGames).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve;
      })
  );
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await settle();
  sportsActions.selectDestination('main', { type: 'live' });
  sportsActions.setSearch('main', 'team');
  await settle();
  complete({ catalog, games: [second] });
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [second], nextCursor: undefined });
  await sportsActions.loadMore('main');
  expect(result()?.sections[0].gameIds).toEqual(['1', '2']);
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(2);
});

it('searches globally from a selected category and returns to that category on cancel', async () => {
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  sportsActions.setHostVisibility('main', true);
  await settle();
  sportsActions.setSearch('main', '  NBA  ');
  await settle();
  const request = jest.mocked(sportsClient.searchGames).mock.calls[0][0];
  expect(request.query).toBe('NBA');
  expect(request.scopeId).toBeUndefined();
  expect(result()?.sections[0].gameIds).toEqual(['1']);
  sportsActions.setSearch('main', null);
  await settle();
  expect(useSportsViewStore.getState().hosts.main.request.destination).toEqual({ type: 'scope', scopeId: 'tennis' });
  expect(result()?.sections[0].gameIds).toEqual(['2']);
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
});

it('retries a failed continuation without discarding earlier Search pages', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalog, games: [first], nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: [second], nextCursor: 'page-3' })
    .mockRejectedValueOnce(new Error('Page unavailable'))
    .mockResolvedValueOnce({ catalog, games: [game('3')], nextCursor: undefined });
  sportsActions.setSearch('main', 'team');
  sportsActions.setHostVisibility('main', true);
  await settle();
  await sportsActions.loadMore('main');
  await sportsActions.loadMore('main');
  expect(result()?.sections[0].gameIds).toEqual(['1', '2']);
  await sportsActions.retry('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls.map(([request]) => request.cursor)).toEqual([
    undefined,
    'page-2',
    'page-3',
    'page-3',
  ]);
  expect(result()?.sections[0].gameIds).toEqual(['1', '2', '3']);
});

it('preserves Search relevance instead of applying browse order', async () => {
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [game('3'), first, second] });
  sportsActions.setSearch('main', 'team');
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(result()?.gameIds).toEqual(['3', '1', '2']);
});

it('restarts Search when its continuation no longer matches the catalog', async () => {
  sportsActions.setSearch('main', 'team');
  sportsActions.setHostVisibility('main', true);
  await settle();
  jest
    .mocked(sportsClient.searchGames)
    .mockRejectedValueOnce(new RainbowFetchError({ message: 'Invalid cursor', responseBody: { code: 9 } }));
  await sportsActions.loadMore('main');
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog: { ...catalog, revision: 2 }, games: [second], nextCursor: undefined });
  await sportsActions.retry('main');
  expect(jest.mocked(sportsClient.searchGames).mock.calls[2][0].cursor).toBeUndefined();
  expect(result()?.sections[0].gameIds).toEqual(['2']);
});

it('returns to Live when retrying a category removed from the catalog', async () => {
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  jest.mocked(sportsClient.getGames).mockRejectedValue(new RainbowFetchError({ message: 'Scope removed', responseBody: { code: 5 } }));
  sportsActions.setHostVisibility('main', true);
  await settle();
  await sportsActions.retry('main');
  await settle();
  expect(useSportsViewStore.getState().hosts.main.request.destination).toEqual({ type: 'live' });
  expect(result()?.sections[0].gameIds).toEqual(['1']);
});

it('retains membership through scheduled, Live, postponed, and scheduled updates', async () => {
  const scheduled = game('1', { status: Game_Status.STATUS_SCHEDULED, startsAt: useSportsViewStore.getState().window.from });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [scheduled] });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(result()?.sections).toEqual([{ type: 'today', gameIds: ['1'] }]);

  sportsActions.setLookupConsumer(owner, {
    route: Routes.POLYMARKET_EVENT_SCREEN,
    eventIds: ['child'],
    visibleIds: ['child'],
    active: true,
  });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  await settle();
  expect(result()?.sections).toEqual([{ type: 'live', gameIds: ['1'] }]);

  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [{ ...scheduled, status: Game_Status.STATUS_POSTPONED }],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: [],
  });
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(result()?.gameIds).toEqual(['1']);
  expect(result()?.sections).toEqual([]);
  expect(useSportsStore.getState().counts.nba).toBe(0);

  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [scheduled],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: [],
  });
  await useSportsStore.getState().fetch(undefined, { force: true });
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  await settle();
  expect(result()?.sections).toEqual([{ type: 'today', gameIds: ['1'] }]);
  expect(useSportsStore.getState().counts.nba).toBe(1);
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
});

it('releases old viewport queries while retaining rendered Games and cached categories', async () => {
  sportsActions.setHostVisibility('main', true);
  await settle();
  const browseKey = useSportsStore.getState().queryKey;
  const rendered = ['a', 'b', 'unavailable'];
  jest.mocked(sportsClient.lookupGames).mockImplementation(async ({ eventIds }) => ({
    catalog,
    games: eventIds.filter(id => id !== 'unavailable').map(id => game(id)),
    resolved: eventIds.filter(id => id !== 'unavailable').map(id => ({ eventId: id, gameId: id })),
    unavailableEventIds: eventIds.filter(id => id === 'unavailable'),
  }));
  sportsActions.setLookupConsumer(owner, { route: Routes.DISCOVER_SCREEN, eventIds: rendered, active: true });
  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });

  const visitedKeys: string[] = [];
  for (const eventId of ['a', 'b', 'unavailable', 'a']) {
    sportsActions.setVisibleLookupEvents(owner, [eventId]);
    await settle();
    visitedKeys.push(useSportsStore.getState().queryKey);
  }
  for (const key of visitedKeys.slice(1, -1)) {
    expect(useSportsStore.getState().getCacheEntry(key)).toBeNull();
  }
  expect(useSportsStore.getState().eventGames).toEqual({ a: 'a', b: 'b', unavailable: null });
  expect(useSportsStore.getState().getCacheEntry(browseKey)).not.toBeNull();

  sportsActions.setVisibleLookupEvents(owner, []);
  expect(useSportsStore.getState().games.a).toBeDefined();
  expect(useSportsStore.getState().eventGames.unavailable).toBeNull();
  sportsActions.removeLookupConsumer(owner);
  expect(useSportsStore.getState().eventGames).toEqual({});
  expect(Object.keys(useSportsStore.getState().games)).toEqual(['1']);
});

it('does not add capped-out games to query membership through a lookup', async () => {
  jest
    .mocked(sportsClient.getLiveGames)
    .mockResolvedValue({ catalog, games: Array.from({ length: 31 }, (_, i) => game(String(i).padStart(2, '0'))) });
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(result()?.gameIds).toHaveLength(30);
  expect(useSportsStore.getState().games['30']).toBeUndefined();
  sportsActions.setLookupConsumer(owner, { route: Routes.POLYMARKET_EVENT_SCREEN, eventIds: ['30'], visibleIds: ['30'], active: true });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue({ catalog, games: [game('30')], resolved: [{ eventId: '30', gameId: '30' }], unavailableEventIds: [] });
  await settle();
  expect(result()?.gameIds).toHaveLength(30);
  expect(result()?.gameIds).not.toContain('30');
  expect(useSportsStore.getState().games['30']).toBeDefined();
  sportsActions.removeLookupConsumer(owner);
  expect(useSportsStore.getState().games['30']).toBeUndefined();
});

it('regroups only queries containing the changed game', async () => {
  sportsActions.setHostVisibility('main', true);
  await settle();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await settle();
  sportsActions.setLookupConsumer(owner, {
    route: Routes.POLYMARKET_EVENT_SCREEN,
    eventIds: ['child'],
    visibleIds: ['child'],
    active: true,
  });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  await settle();
  const group = jest.spyOn(sections, 'getSportsSections');
  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [{ ...first, status: Game_Status.STATUS_ENDED }],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: [],
  });
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(group).toHaveBeenCalledTimes(1);
  expect(group.mock.calls[0][0].destination).toEqual({ type: 'live' });
  expect(useSportsStore.getState().counts.nba).toBe(0);
  expect(useSportsStore.getState().counts.atp).toBe(1);
});

it('releases abandoned failed lookup queries while retaining cached categories', async () => {
  sportsActions.setHostVisibility('main', true);
  await settle();
  const browseKey = useSportsStore.getState().queryKey;
  const eventIds = ['101', '102', '103'];
  jest.mocked(sportsClient.lookupGames).mockRejectedValue(new Error('Lookup unavailable'));
  sportsActions.setLookupConsumer(owner, { route: Routes.DISCOVER_SCREEN, eventIds, active: true });
  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });

  const failedKeys: string[] = [];
  for (const eventId of eventIds) {
    sportsActions.setVisibleLookupEvents(owner, [eventId]);
    await settle();
    failedKeys.push(useSportsStore.getState().queryKey);
  }
  expect(sportsClient.lookupGames).toHaveBeenCalledTimes(3);
  expect(useSportsStore.getState().getCacheEntry(failedKeys[0])).toBeNull();
  expect(useSportsStore.getState().getCacheEntry(failedKeys[2])?.errorInfo?.error.message).toBe('Lookup unavailable');

  sportsActions.setVisibleLookupEvents(owner, ['101']);
  await settle();
  expect(useSportsStore.getState().getCacheEntry(failedKeys[1])).toBeNull();
  expect(useSportsStore.getState().getCacheEntry(browseKey)).not.toBeNull();
  expect(useSportsStore.getState().results.live?.gameIds).toEqual(['1']);
  expect(useSportsStore.getState().eventGames).toEqual({});
});

it('replaces query membership even when fresh browse sections are unchanged', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [first, game('other')] });
  sportsActions.setHostVisibility('main', true);
  await settle();
  sportsActions.setLookupConsumer(owner, {
    route: Routes.POLYMARKET_EVENT_SCREEN,
    eventIds: ['child'],
    visibleIds: ['child'],
    active: true,
  });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [{ ...first, status: Game_Status.STATUS_POSTPONED }],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: [],
  });
  await settle();
  expect(result()?.gameIds).toEqual(['1', 'other']);
  const before = result()?.sections;
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [game('other')] });
  await settle();
  await sportsActions.refresh('main');
  expect(result()?.sections).toBe(before);
  expect(result()?.gameIds).toEqual(['other']);
  sportsActions.removeLookupConsumer(owner);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});

it('releases abandoned failed searches while retaining available results', async () => {
  sportsActions.setHostVisibility('main', true);
  await settle();
  const browseKey = useSportsStore.getState().queryKey;
  sportsActions.setSearch('main', 'retained');
  await settle();
  const retainedKey = useSportsStore.getState().queryKey;
  jest.mocked(sportsClient.searchGames).mockRejectedValue(new Error('offline'));

  const failedKeys: string[] = [];
  for (const query of ['first failure', 'second failure', 'third failure']) {
    sportsActions.setSearch('main', query);
    await settle();
    const data = useSportsStore.getState();
    expect(data.getCacheEntry()?.errorInfo?.error.message).toBe('offline');
    failedKeys.push(data.queryKey);
  }
  for (const key of failedKeys.slice(0, -1)) {
    expect(useSportsStore.getState().getCacheEntry(key)).toBeNull();
  }
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(4);
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  expect(useSportsStore.getState().getCacheEntry(failedKeys[2])).toBeNull();
  expect(useSportsStore.getState().getCacheEntry(retainedKey)).not.toBeNull();
  expect(useSportsStore.getState().getCacheEntry(browseKey)).not.toBeNull();
  expect(useSportsStore.getState().search).toMatchObject({ query: 'retained', gameIds: ['1'] });
  expect(useSportsStore.getState().results.live?.gameIds).toEqual(['1']);
  await settle();
});

it('does not recreate an abandoned search entry when its request fails late', async () => {
  sportsActions.setHostVisibility('main', true);
  await settle();
  let fail!: (reason: Error) => void;
  jest.mocked(sportsClient.searchGames).mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      })
  );
  sportsActions.setSearch('main', 'abandoned');
  await settle();
  const abandonedKey = useSportsStore.getState().queryKey;
  sportsActions.setSearch('main', null);
  await settle();

  fail(new Error('late failure'));
  await settle();
  expect(useSportsStore.getState().getCacheEntry(abandonedKey)).toBeNull();
  expect(result()?.gameIds).toEqual(['1']);
});
