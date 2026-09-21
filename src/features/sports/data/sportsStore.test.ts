import { AppState } from 'react-native';

import { parseQueryKey } from '@storesjs/stores';

import { Game, Game_Status, SportsCatalog, type GetGamesResponse } from '@/features/sports/core/generated/sports';
import * as sections from '@/features/sports/core/sections';
import { sportsClient } from '@/features/sports/data/api/client';
import { getSportsResult, sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
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
async function read(force = false) {
  if (useNavigationStore.getState().activeRoute === Routes.SPORTS_SCREEN) sportsActions.setHostVisibility('main', true);
  await new Promise<void>(resolve => {
    setImmediate(resolve);
  });
  return useSportsStore.getState().fetch(undefined, { force });
}

let stop: () => void;
beforeEach(() => {
  useSportsStore.getState().clear();
  AppState.currentState = 'active';
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
  sportsActions.releaseHost('main');
  sportsActions.releaseHost('predictions');
  sportsActions.removeLookupConsumer(owner);
  syncSportsActivity();
});
afterAll(() => useSportsStore.getState().reset(true));

it('publishes sections and records atomically and preserves unchanged leaves on a score update', async () => {
  const unsubscribe = useSportsStore.subscribe(state => {
    for (const result of Object.values(state.results)) {
      for (const id of result?.sections.flatMap(section => section.gameIds) ?? []) expect(state.games[id]).toBeDefined();
    }
  });
  await read();
  const before = useSportsStore.getState();
  const section = result();
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({
    catalog: SportsCatalog.fromJSON(catalog),
    games: [game('1', { score: Game.fromJSON({ score: [{ kind: 'KIND_TOTAL', first: { value: 1 }, second: { value: 0 } }] }).score })],
  });
  await read(true);
  const after = useSportsStore.getState();
  expect(after.games['1']?.score).not.toBe(before.games['1']?.score);
  expect(after.games['1']?.participants).toBe(before.games['1']?.participants);
  expect(after.games['1']?.participants[0].winner).toBe(before.games['1']?.participants[0].winner);
  expect(after.catalog).toBe(before.catalog);
  expect(result()).toBe(section);
  unsubscribe();
});

it('retains visited categories through hiding, unmounting, and a host handoff without another fresh read', async () => {
  await read();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await read();
  sportsActions.selectDestination('main', { type: 'live' });
  await read();
  expect(result()?.sections[0].gameIds).toEqual(['1']);
  sportsActions.releaseHost('main');
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN });
  sportsActions.selectDestination('predictions', { type: 'scope', scopeId: 'tennis' });
  sportsActions.setHostVisibility('predictions', true);
  await read();
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
  const old = read();
  await new Promise<void>(resolve => {
    setImmediate(resolve);
  });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await read();
  complete({ catalog, games: [first] });
  await old;
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
  await read();
  expect(sportsClient.lookupGames).not.toHaveBeenCalled();
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  await read();
  expect(sportsClient.lookupGames).toHaveBeenCalledTimes(1);
  expect(useSportsStore.getState().eventGames).toEqual({ child: '1' });
  sportsActions.removeLookupConsumer(owner);
  expect(useSportsStore.getState().games['1']).toBeDefined();
});

it('updates retained section membership when a detail read changes a game status', async () => {
  const scheduled = game('1', { status: Game_Status.STATUS_SCHEDULED, startsAt: useSportsViewStore.getState().window.from });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [scheduled] });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  await read();
  expect(result()?.sections[0].type).toBe('today');
  sportsActions.setLookupConsumer(owner, {
    route: Routes.POLYMARKET_EVENT_SCREEN,
    eventIds: ['child'],
    visibleIds: ['child'],
    active: true,
  });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  await read();
  expect(result()?.sections[0].type).toBe('live');
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  await read();
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
});

it('caps each section independently and counts only retained browse games', async () => {
  const today = useSportsViewStore.getState().window.from;
  const tomorrow = new Date(new Date(today).getTime() + 86400000).toISOString();
  const games = Array.from({ length: 35 }, (_, i) => game(`live-${i}`)).concat(
    Array.from({ length: 35 }, (_, i) => game(`today-${i}`, { status: Game_Status.STATUS_SCHEDULED, startsAt: today })),
    Array.from({ length: 35 }, (_, i) => game(`later-${i}`, { status: Game_Status.STATUS_SCHEDULED, startsAt: tomorrow }))
  );
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  await read();
  expect(result()?.sections.map(section => section.gameIds.length)).toEqual([30, 30, 30]);
  expect(Object.keys(useSportsStore.getState().games)).toHaveLength(90);
  expect(useSportsStore.getState().counts.nba).toBe(90);
});

it('caps each Live group independently', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({
    catalog,
    games: Array.from({ length: 40 }, (_, i) => game(`${i}`)).concat(
      Array.from({ length: 40 }, (_, i) => game(`tennis-${i}`, { competitionIds: ['atp'] }))
    ),
  });
  await read();
  expect(result()?.sections.map(section => section.gameIds.length)).toEqual([30, 30]);
  expect(Object.keys(useSportsStore.getState().games)).toHaveLength(60);
});

it('accumulates Search once, stops at thirty, and refreshes from the first page', async () => {
  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValueOnce({ catalog, games: Array.from({ length: 20 }, (_, i) => game(`${i}`)), nextCursor: 'page-2' })
    .mockResolvedValueOnce({ catalog, games: Array.from({ length: 20 }, (_, i) => game(`${i + 15}`)), nextCursor: 'page-3' });
  sportsActions.setSearch('main', 'team');
  await read();
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

it('refetches a replaced Search instead of retaining its freshness without its result', async () => {
  sportsActions.setSearch('main', 'first');
  await read();
  sportsActions.setSearch('main', 'second');
  await read();
  sportsActions.setSearch('main', 'first');
  expect(result()).toBeUndefined();
  await read();
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(3);
  expect(result()?.sections[0].gameIds).toEqual(['1']);
});

it('invalidates old memberships and freshness together on a catalog revision', async () => {
  await read();
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog: { ...catalog, revision: 2 }, games: [second] });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await read();
  expect(useSportsStore.getState().results.live).toBeUndefined();
  await read();
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
  sportsActions.selectDestination('main', { type: 'live' });
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog: { ...catalog, revision: 2 }, games: [first] });
  await read();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(2);
});

it('clears the previous calendar window without tearing down the query owner', async () => {
  await read();
  const now = new Date();
  sportsActions.updateWindow(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  expect(result()).toBeUndefined();
  await read();
  expect(result()?.sections[0].gameIds).toEqual(['1']);
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(2);
});

it('does not attribute another request’s failure to a successfully cached category', async () => {
  await read();
  jest.mocked(sportsClient.getGames).mockRejectedValue(new Error('Schedule unavailable'));
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await read();
  expect(useSportsStore.getState().getCacheEntry()?.errorInfo?.error.message).toBe('Schedule unavailable');
  sportsActions.selectDestination('main', { type: 'live' });
  await read();
  expect(result()?.sections[0].gameIds).toEqual(['1']);
  expect(useSportsStore.getState().getCacheEntry()?.errorInfo).toBeNull();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
});

it('can load another Search page after cancelling a different read and returning to cached Search', async () => {
  sportsActions.setSearch('main', 'team');
  await read();
  let complete!: (data: GetGamesResponse) => void;
  jest.mocked(sportsClient.getGames).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve;
      })
  );
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await new Promise<void>(resolve => {
    setImmediate(resolve);
  });
  sportsActions.selectDestination('main', { type: 'live' });
  sportsActions.setSearch('main', 'team');
  await read();
  complete({ catalog, games: [second] });
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [second], nextCursor: undefined });
  await sportsActions.loadMore('main');
  expect(result()?.sections[0].gameIds).toEqual(['1', '2']);
  expect(sportsClient.searchGames).toHaveBeenCalledTimes(2);
});

it('searches globally from a selected category and returns to that category on cancel', async () => {
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await read();
  sportsActions.setSearch('main', '  NBA  ');
  await read();
  const request = jest.mocked(sportsClient.searchGames).mock.calls[0][0];
  expect(request.query).toBe('NBA');
  expect(request.scopeId).toBeUndefined();
  expect(result()?.sections[0].gameIds).toEqual(['1']);
  sportsActions.setSearch('main', null);
  await read();
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
  await read();
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

it('retains provider relevance and statuses in Search without browse sorting', async () => {
  jest.mocked(sportsClient.searchGames).mockResolvedValue({
    catalog,
    games: [
      game('finished', { status: Game_Status.STATUS_ENDED }),
      first,
      game('postponed', { status: Game_Status.STATUS_POSTPONED }),
      first,
    ],
    nextCursor: undefined,
  });
  sportsActions.setSearch('main', 'team');
  await read();
  expect(result()?.sections[0].gameIds).toEqual(['finished', '1', 'postponed']);
});

it('restarts Search when its continuation no longer matches the catalog', async () => {
  sportsActions.setSearch('main', 'team');
  await read();
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
  await read();
  await sportsActions.retry('main');
  await read();
  expect(useSportsViewStore.getState().hosts.main.request.destination).toEqual({ type: 'live' });
  expect(result()?.sections[0].gameIds).toEqual(['1']);
});

it('keeps admitted membership when a game leaves and re-enters its display group', async () => {
  const scheduled = game('1', { status: Game_Status.STATUS_SCHEDULED, startsAt: useSportsViewStore.getState().window.from });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [scheduled] });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  await read();
  sportsActions.setLookupConsumer(owner, {
    route: Routes.POLYMARKET_EVENT_SCREEN,
    eventIds: ['child'],
    visibleIds: ['child'],
    active: true,
  });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [{ ...scheduled, status: Game_Status.STATUS_POSTPONED }],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: [],
  });
  await read(true);
  expect(result()?.sections).toEqual([]);
  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue({ catalog, games: [scheduled], resolved: [{ eventId: 'child', gameId: '1' }], unavailableEventIds: [] });
  await read(true);
  expect(result()?.sections).toEqual([{ type: 'today', gameIds: ['1'] }]);
  expect(sportsClient.getGames).toHaveBeenCalledTimes(1);
});

it('does no section or count derivation for a lookup score update', async () => {
  await read();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await read();
  sportsActions.setLookupConsumer(owner, {
    route: Routes.POLYMARKET_EVENT_SCREEN,
    eventIds: ['child'],
    visibleIds: ['child'],
    active: true,
  });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  await read();
  const group = jest.spyOn(sections, 'getSportsSections');
  const count = jest.spyOn(sections, 'getSportsDirectoryCounts');
  const before = useSportsStore.getState();
  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [{ ...first, score: Game.fromJSON({ score: [{ kind: 'KIND_TOTAL', first: { value: 2 }, second: { value: 0 } }] }).score }],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: [],
  });
  await read(true);
  expect(useSportsStore.getState().games['1']?.score).not.toEqual(before.games['1']?.score);
  expect(group).not.toHaveBeenCalled();
  expect(count).not.toHaveBeenCalled();
  expect(useSportsStore.getState().results).toBe(before.results);
  group.mockRestore();
  count.mockRestore();
});

it('retains rendered lookups without retaining historical viewport queries', async () => {
  await read();
  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
  const rendered = ['a', 'b', 'c', 'unavailable'];
  jest.mocked(sportsClient.lookupGames).mockImplementation(async ({ eventIds }) => ({
    catalog,
    games: eventIds.filter(id => id !== 'unavailable').map(id => game(id)),
    resolved: eventIds.filter(id => id !== 'unavailable').map(id => ({ eventId: id, gameId: id })),
    unavailableEventIds: eventIds.filter(id => id === 'unavailable'),
  }));
  for (let i = 0; i < 24; i++) {
    sportsActions.setLookupConsumer(owner, {
      route: Routes.DISCOVER_SCREEN,
      eventIds: rendered,
      visibleIds: [rendered[i % rendered.length]],
      active: true,
    });
    await read();
    expect(Object.keys(useSportsStore.getState().queryCache).length).toBeLessThanOrEqual(2);
  }
  expect(useSportsStore.getState().eventGames).toEqual({ a: 'a', b: 'b', c: 'c', unavailable: null });
  sportsActions.setLookupConsumer(owner, { route: Routes.DISCOVER_SCREEN, eventIds: rendered, visibleIds: [], active: true });
  expect(useSportsStore.getState().games.a).toBeDefined();
  expect(useSportsStore.getState().eventGames.unavailable).toBeNull();
  sportsActions.removeLookupConsumer(owner);
  expect(useSportsStore.getState().eventGames).toEqual({});
  expect(Object.keys(useSportsStore.getState().games)).toEqual(['1']);
});

it('does not add capped-out games to query membership through a lookup', async () => {
  jest
    .mocked(sportsClient.getLiveGames)
    .mockResolvedValue({ catalog, games: Array.from({ length: 35 }, (_, i) => game(String(i).padStart(2, '0'))) });
  await read();
  expect(result()?.gameIds).toHaveLength(30);
  expect(useSportsStore.getState().games['34']).toBeUndefined();
  sportsActions.setLookupConsumer(owner, { route: Routes.POLYMARKET_EVENT_SCREEN, eventIds: ['34'], visibleIds: ['34'], active: true });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  jest
    .mocked(sportsClient.lookupGames)
    .mockResolvedValue({ catalog, games: [game('34')], resolved: [{ eventId: '34', gameId: '34' }], unavailableEventIds: [] });
  await read();
  expect(result()?.gameIds).toHaveLength(30);
  expect(result()?.gameIds).not.toContain('34');
  expect(useSportsStore.getState().games['34']).toBeDefined();
  sportsActions.removeLookupConsumer(owner);
  expect(useSportsStore.getState().games['34']).toBeUndefined();
});

it('regroups only queries containing the changed game', async () => {
  await read();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await read();
  sportsActions.setLookupConsumer(owner, {
    route: Routes.POLYMARKET_EVENT_SCREEN,
    eventIds: ['child'],
    visibleIds: ['child'],
    active: true,
  });
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_EVENT_SCREEN });
  await read();
  const group = jest.spyOn(sections, 'getSportsSections');
  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [{ ...first, status: Game_Status.STATUS_ENDED }],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: [],
  });
  await read(true);
  expect(group).toHaveBeenCalledTimes(1);
  expect(group.mock.calls[0][0].destination).toEqual({ type: 'live' });
  expect(useSportsStore.getState().counts.nba).toBe(0);
  expect(useSportsStore.getState().counts.atp).toBe(1);
});

it('does no section or count derivation for a browse score update', async () => {
  await read();
  const group = jest.spyOn(sections, 'getSportsSections');
  const count = jest.spyOn(sections, 'getSportsDirectoryCounts');
  const before = useSportsStore.getState();
  jest
    .mocked(sportsClient.getLiveGames)
    .mockResolvedValue({ catalog, games: [{ ...first, score: Game.fromJSON({ score: [{ first: { value: 3 } }] }).score }] });
  await read(true);
  expect(useSportsStore.getState().games['1']?.score).not.toEqual(before.games['1']?.score);
  expect(group).not.toHaveBeenCalled();
  expect(count).not.toHaveBeenCalled();
  expect(useSportsStore.getState().results).toBe(before.results);
});

it('bounds failed lookup metadata while retaining cached categories', async () => {
  await read();
  useNavigationStore.setState({ activeRoute: Routes.DISCOVER_SCREEN });
  jest.mocked(sportsClient.lookupGames).mockRejectedValue(new Error('Lookup unavailable'));
  const eventIds = Array.from({ length: 24 }, (_, i) => `event-${i}`);
  for (const eventId of eventIds) {
    sportsActions.setLookupConsumer(owner, { route: Routes.DISCOVER_SCREEN, eventIds, visibleIds: [eventId], active: true });
    await read();
    const entries = Object.values(useSportsStore.getState().queryCache);
    expect(entries.filter(entry => entry?.cacheTime === 0).length).toBeLessThanOrEqual(2);
  }
  expect(useSportsStore.getState().results.live?.gameIds).toEqual(['1']);
  expect(useSportsStore.getState().eventGames).toEqual({});
});

it('replaces query membership even when fresh browse sections are unchanged', async () => {
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [first, game('other')] });
  await read();
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
  await read(true);
  expect(result()?.gameIds).toEqual(['1', 'other']);
  const before = result()?.sections;
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [game('other')] });
  await read(true);
  expect(result()?.sections).toBe(before);
  expect(result()?.gameIds).toEqual(['other']);
  sportsActions.removeLookupConsumer(owner);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});

it('shares one native activity listener and calendar timer until the final active consumer leaves', async () => {
  const timers = jest.spyOn(global, 'setTimeout');
  await read();
  syncSportsActivity();
  sportsActions.setLookupConsumer(owner, { route: Routes.POLYMARKET_EVENT_SCREEN, eventIds: ['child'], active: true });
  syncSportsActivity();
  expect(AppState.addEventListener).toHaveBeenCalledTimes(1);
  const subscription = jest.mocked(AppState.addEventListener).mock.results[0].value;
  const dayTimers = timers.mock.calls.filter(([, delay]) => typeof delay === 'number' && delay > 60_000);
  expect(dayTimers).toHaveLength(1);
  sportsActions.releaseHost('main');
  syncSportsActivity();
  expect(subscription.remove).not.toHaveBeenCalled();
  sportsActions.removeLookupConsumer(owner);
  syncSportsActivity();
  expect(subscription.remove).toHaveBeenCalledTimes(1);
});

it('pauses requests in the background and refreshes the calendar on native activation', async () => {
  await read();
  const today = useSportsViewStore.getState().window;
  syncSportsActivity();
  const onChange = jest.mocked(AppState.addEventListener).mock.calls[0][1];
  onChange('background');
  await new Promise<void>(resolve => {
    setImmediate(resolve);
  });
  expect(parseQueryKey(useSportsStore.getState().queryKey).request).toBeNull();
  expect(useSportsViewStore.getState().hosts.main.visible).toBe(true);
  expect(result()?.gameIds).toEqual(['1']);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  sportsActions.updateWindow(yesterday);
  onChange('active');
  await read();
  expect(useSportsViewStore.getState().window).toEqual(today);
  expect(parseQueryKey(useSportsStore.getState().queryKey).request).toEqual({ type: 'browse', destination: { type: 'live' } });
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(2);
});

it('releases abandoned failed search terms while preserving the last successful search and cached categories', async () => {
  await read();
  sportsActions.setSearch('main', 'retained');
  await read();
  const retained = useSportsStore.getState().search;
  jest.mocked(sportsClient.searchGames).mockRejectedValue(new Error('offline'));
  for (let index = 0; index < 24; index++) {
    sportsActions.setSearch('main', `failed-${index}`);
    await read();
    expect(useSportsStore.getState().getCacheEntry()?.errorInfo?.error).toEqual(new Error('offline'));
    expect(Object.keys(useSportsStore.getState().queryCache)).toHaveLength(3);
  }
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  expect(Object.keys(useSportsStore.getState().queryCache)).toHaveLength(2);
  expect(useSportsStore.getState().search).toBe(retained);
  expect(useSportsStore.getState().results.live?.gameIds).toEqual(['1']);
});

it('does not recreate metadata when an abandoned search fails after navigation', async () => {
  await read();
  let fail!: (reason: Error) => void;
  jest.mocked(sportsClient.searchGames).mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      })
  );
  sportsActions.setSearch('main', 'abandoned');
  const pending = read();
  await new Promise<void>(resolve => {
    setImmediate(resolve);
  });
  sportsActions.setSearch('main', null);
  await read();
  fail(new Error('late failure'));
  await pending;
  expect(Object.keys(useSportsStore.getState().queryCache)).toHaveLength(1);
});
