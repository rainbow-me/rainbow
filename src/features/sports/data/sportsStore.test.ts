import { Game, SportsCatalog, type GetGamesResponse, type LookupGamesResponse } from '@/features/sports/core/generated/sports';
import { sportsClient } from '@/features/sports/data/api/client';
import {
  getSportsAvailableGameIds,
  getSportsResult,
  sportsActions,
  useSportsLookupStore,
  useSportsStore,
} from '@/features/sports/data/sportsStore';
import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

jest.mock('@/features/sports/data/api/client', () => ({
  sportsClient: { getCatalog: jest.fn(), getLiveGames: jest.fn(), getGames: jest.fn(), lookupGames: jest.fn(), searchGames: jest.fn() },
}));

const catalog = SportsCatalog.fromJSON({
  revision: 1,
  sports: [
    { id: 'basketball', name: 'Basketball', browse: 'BROWSE_COMPETITIONS', competitions: [{ id: 'nba', name: 'NBA' }] },
    { id: 'tennis', name: 'Tennis', browse: 'BROWSE_GAMES', competitions: [{ id: 'atp', name: 'ATP' }] },
  ],
});
const first = Game.fromJSON({ id: '1', competitionIds: ['nba'], status: 'STATUS_LIVE' });
const second = Game.fromJSON({ id: '2', competitionIds: ['atp'], status: 'STATUS_SCHEDULED' });
const owner = Symbol('detail');
const initial = useSportsStore.getInitialState();

beforeEach(() => {
  sportsActions.releaseHost('main');
  sportsActions.releaseHost('predictions');
  sportsActions.removeExactConsumer(owner);
  useSportsStore.setState({
    catalog,
    games: {},
    eventGames: {},
    queryCache: {},
    hosts: initial.hosts,
    window: initial.window,
    exactConsumers: new Map(),
  });
  jest.clearAllMocks();
  jest.mocked(sportsClient.getCatalog).mockResolvedValue(catalog);
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [first] });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog, games: [second] });
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [first], nextCursor: 'page-2' });
  jest.mocked(sportsClient.lookupGames).mockResolvedValue({
    catalog,
    games: [first],
    resolved: [{ eventId: 'child', gameId: '1' }],
    unavailableEventIds: ['unsupported'],
  });
});

afterAll(() => {
  useSportsLookupStore.getState().reset(true);
  useSportsStore.getState().reset(true);
});

test('publishes complete results with shared Game records and preserves unchanged references', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1']);
  const game = useSportsStore.getState().games['1'];
  const result = getSportsResult(useSportsStore.getState(), 'main');
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [Game.fromJSON(first)] });
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(useSportsStore.getState().games['1']).toBe(game);
  expect(getSportsResult(useSportsStore.getState(), 'main')).toBe(result);

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [] });
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual([]);
  expect(useSportsStore.getState().games).toEqual({});
});

test('hosts keep independent selections and release only their own records', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch(undefined, { force: true });
  sportsActions.setHostVisibility('main', false);
  sportsActions.selectDestination('predictions', { type: 'scope', scopeId: 'tennis' });
  sportsActions.setHostVisibility('predictions', true);
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(sportsClient.getGames).toHaveBeenLastCalledWith(
    { scopeId: 'tennis', ...useSportsStore.getState().window },
    expect.any(AbortController)
  );
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1']);
  expect(getSportsResult(useSportsStore.getState(), 'predictions')?.gameIds).toEqual(['2']);
  expect(Object.keys(useSportsStore.getState().games)).toEqual(['1', '2']);

  sportsActions.releaseHost('predictions');
  expect(Object.keys(useSportsStore.getState().games)).toEqual(['1']);
  sportsActions.releaseHost('main');
  expect(useSportsStore.getState().games).toEqual({});
  expect(useSportsStore.getState().catalog).toBe(catalog);
});

test('a replaced destination cannot receive the old response', async () => {
  let finish!: (response: GetGamesResponse) => void;
  jest.mocked(sportsClient.getLiveGames).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  sportsActions.setHostVisibility('main', true);
  const oldRead = useSportsStore.getState().fetch(undefined, { force: true });
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await useSportsStore.getState().fetch(undefined, { force: true });
  finish({ catalog, games: [first] });
  await oldRead;
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['2']);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});

test('exact child resolution shares Games without adding browse membership', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch(undefined, { force: true });
  sportsActions.setExactConsumer(owner, ['unsupported', 'child', 'child'], ['child', 'unsupported']);
  await useSportsLookupStore.getState().fetch(undefined, { force: true });
  expect(sportsClient.lookupGames).toHaveBeenLastCalledWith({ eventIds: ['child', 'unsupported'] }, expect.any(AbortController));
  expect(useSportsStore.getState().eventGames).toEqual({ child: '1', unsupported: null });
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1']);
  sportsActions.releaseHost('main');
  expect(useSportsStore.getState().games['1']).toBeDefined();
  sportsActions.setExactConsumer(owner, ['child', 'unsupported'], []);
  expect(useSportsLookupStore.getState().enabled).toBe(false);
  expect(useSportsStore.getState().games['1']).toBeDefined();
  sportsActions.removeExactConsumer(owner);
  expect(useSportsStore.getState().games).toEqual({});
  expect(useSportsStore.getState().eventGames).toEqual({});
});

test('visible lookup changes retain every rendered card until its consumer releases it', async () => {
  sportsActions.setExactConsumer(owner, ['child', 'unsupported'], ['child']);
  await useSportsLookupStore.getState().fetch(undefined, { force: true });
  const game = useSportsStore.getState().games['1'];
  expect(game).toBeDefined();
  sportsActions.setExactConsumer(owner, ['child', 'unsupported'], ['unsupported', 'retired']);
  jest.mocked(sportsClient.lookupGames).mockResolvedValueOnce({ catalog, games: [], resolved: [], unavailableEventIds: ['unsupported'] });
  await useSportsLookupStore.getState().fetch(undefined, { force: true });
  expect(sportsClient.lookupGames).toHaveBeenLastCalledWith({ eventIds: ['unsupported'] }, expect.any(AbortController));
  expect(useSportsStore.getState().eventGames.child).toBe('1');
  expect(useSportsStore.getState().games['1']).toBe(game);
  sportsActions.removeExactConsumer(owner);
  expect(useSportsStore.getState().eventGames).toEqual({});
  expect(useSportsStore.getState().games).toEqual({});
});

test('lookup completion after its consumer leaves cannot retain orphan Games', async () => {
  let finish!: (response: LookupGamesResponse) => void;
  jest.mocked(sportsClient.lookupGames).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  sportsActions.setExactConsumer(owner, ['child'], ['child']);
  const read = useSportsLookupStore.getState().fetch(undefined, { force: true });
  sportsActions.removeExactConsumer(owner);
  finish({ catalog, games: [first], resolved: [{ eventId: 'child', gameId: '1' }], unavailableEventIds: [] });
  await read;
  expect(useSportsStore.getState().games).toEqual({});
  expect(useSportsStore.getState().eventGames).toEqual({});
});

test('Search appends canonical IDs once and replacing its text discards old pages', async () => {
  sportsActions.setSearch('main', 'Knicks');
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch(undefined, { force: true });
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [first, second] });
  sportsActions.loadMore('main');
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(sportsClient.searchGames).toHaveBeenLastCalledWith(
    expect.objectContaining({ query: 'Knicks', cursor: 'page-2' }),
    expect.any(AbortController)
  );
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1', '2']);
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1', '2']);
  expect(Object.values(useSportsStore.getState().queryCache).filter(entry => entry?.data)).toHaveLength(1);
  sportsActions.setSearch('main', 'Spurs');
  expect(getSportsResult(useSportsStore.getState(), 'main')).toBeNull();
  expect(useSportsStore.getState().games).toEqual({});
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(sportsClient.searchGames).toHaveBeenLastCalledWith(
    expect.objectContaining({ query: 'Spurs', cursor: undefined }),
    expect.any(AbortController)
  );
});

test('an older policy cannot replace current catalog or browse membership', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch(undefined, { force: true });
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog: { ...catalog, revision: 0 }, games: [second] });
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(useSportsStore.getState().catalog?.revision).toBe(1);
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1']);
});

test('reopening a released Search starts at page one despite recent query metadata', async () => {
  sportsActions.setSearch('predictions', 'Knicks');
  sportsActions.setHostVisibility('predictions', true);
  await useSportsStore.getState().fetch();
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [second] });
  sportsActions.loadMore('predictions');
  await useSportsStore.getState().fetch();
  expect(getSportsResult(useSportsStore.getState(), 'predictions')?.gameIds).toEqual(['1', '2']);

  sportsActions.releaseHost('predictions');
  expect(useSportsStore.getState().hosts.predictions.request.cursor).toBeUndefined();
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [first] });
  sportsActions.setHostVisibility('predictions', true);
  await useSportsStore.getState().fetch();
  expect(sportsClient.searchGames).toHaveBeenLastCalledWith(
    expect.objectContaining({ query: 'Knicks', cursor: undefined }),
    expect.any(AbortController)
  );
  expect(getSportsResult(useSportsStore.getState(), 'predictions')?.gameIds).toEqual(['1']);
});

test('revisiting a fresh destination restores its exact content synchronously without another read', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch();
  const live = getSportsResult(useSportsStore.getState(), 'main');
  const game = useSportsStore.getState().games['1'];
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  expect(getSportsResult(useSportsStore.getState(), 'main')).toBeNull();
  await useSportsStore.getState().fetch();
  sportsActions.selectDestination('main', { type: 'live' });
  expect(getSportsResult(useSportsStore.getState(), 'main')).toBe(live);
  expect(useSportsStore.getState().games['1']).toBe(game);
  expect(useSportsStore.getState().getStatus('isLoading')).toBe(false);
  await useSportsStore.getState().fetch();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
});

test('a stale revisit keeps its exact content during a deferred refresh and failure', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch();
  const live = getSportsResult(useSportsStore.getState(), 'main');
  const game = useSportsStore.getState().games['1'];
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await useSportsStore.getState().fetch();
  const clock = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
  let fail!: (error: Error) => void;
  jest.mocked(sportsClient.getLiveGames).mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        fail = reject;
      })
  );
  try {
    sportsActions.selectDestination('main', { type: 'live' });
    expect(getSportsResult(useSportsStore.getState(), 'main')).toBe(live);
    const refresh = useSportsStore.getState().fetch();
    expect(useSportsStore.getState().getStatus('isLoading')).toBe(true);
    expect(getSportsResult(useSportsStore.getState(), 'main')).toBe(live);
    expect(useSportsStore.getState().games['1']).toBe(game);
    fail(new Error('temporarily unavailable'));
    await refresh;
    expect(getSportsResult(useSportsStore.getState(), 'main')).toBe(live);
    expect(useSportsStore.getState().games['1']).toBe(game);
    expect(useSportsStore.getState().getStatus('isError')).toBe(true);
  } finally {
    clock.mockRestore();
  }
});

test('directory navigation preserves available Games while exact-only Games stay out of counts', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await useSportsStore.getState().fetch();
  sportsActions.selectDestination('main', { type: 'all' });
  await useSportsStore.getState().fetch();
  expect(getSportsAvailableGameIds(useSportsStore.getState())).toEqual(['1', '2']);
  jest.mocked(sportsClient.lookupGames).mockResolvedValueOnce({
    catalog,
    games: [Game.fromJSON({ id: '3' })],
    resolved: [{ eventId: 'child', gameId: '3' }],
    unavailableEventIds: [],
  });
  sportsActions.setExactConsumer(owner, ['child'], ['child']);
  await useSportsLookupStore.getState().fetch(undefined, { force: true });
  expect(useSportsStore.getState().games['3']).toBeDefined();
  expect(getSportsAvailableGameIds(useSportsStore.getState())).toEqual(['1', '2']);
});

test('new windows and catalog revisions cannot expose previous result memberships', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch();
  const window = useSportsStore.getState().window;
  sportsActions.updateWindow(new Date(Date.parse(window.until) + 86_400_000));
  expect(getSportsResult(useSportsStore.getState(), 'main')).toBeNull();
  expect(useSportsStore.getState().games).toEqual({});
  await useSportsStore.getState().fetch();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await useSportsStore.getState().fetch();
  jest.mocked(sportsClient.getGames).mockResolvedValueOnce({ catalog: { ...catalog, revision: 2 }, games: [second] });
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['2']);
  sportsActions.selectDestination('main', { type: 'live' });
  expect(getSportsResult(useSportsStore.getState(), 'main')).toBeNull();
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});

test('every observable cached membership has canonical Games and no raw response payload', async () => {
  const missing: string[] = [];
  const cachedShapes: string[] = [];
  const stop = useSportsStore.subscribe(state => {
    for (const entry of Object.values(state.queryCache)) {
      if (entry?.data) cachedShapes.push(Object.keys(entry.data).sort().join(','));
      for (const id of entry?.data?.gameIds ?? []) if (!state.games[id]) missing.push(id);
    }
  });
  try {
    sportsActions.setHostVisibility('main', true);
    await useSportsStore.getState().fetch();
    sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
    await useSportsStore.getState().fetch();
    sportsActions.releaseHost('main');
    expect(missing).toEqual([]);
    expect(new Set(cachedShapes)).toEqual(new Set(['gameIds,nextCursor']));
    expect(useSportsStore.getState().queryCache).toEqual({});
    expect(useSportsStore.getState().games).toEqual({});
  } finally {
    stop();
  }
});

test('a drilled scope retains its navigation root and rail selection replaces that root', () => {
  sportsActions.selectDestination('main', { type: 'all' });
  sportsActions.openScope('main', 'basketball');
  sportsActions.openScope('main', 'nba');
  expect(useSportsStore.getState().hosts.main.navigationRoot).toEqual({ type: 'all' });
  sportsActions.goBack('main');
  expect(useSportsStore.getState().hosts.main.request.destination).toEqual({ type: 'scope', scopeId: 'basketball' });
  sportsActions.goBack('main');
  expect(useSportsStore.getState().hosts.main.request.destination).toEqual({ type: 'all' });
  sportsActions.openScope('main', 'nba');
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'nba' });
  expect(useSportsStore.getState().hosts.main.navigationRoot).toEqual({ type: 'scope', scopeId: 'nba' });
  expect(useSportsStore.getState().hosts.predictions.navigationRoot).toEqual({ type: 'live' });
});

test('a removed scope returns to Live and an invalid cursor restarts Search', async () => {
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  sportsActions.setHostVisibility('main', true);
  jest
    .mocked(sportsClient.getGames)
    .mockRejectedValueOnce(new RainbowFetchError({ message: 'Scope not found', responseBody: { code: 5 } }));
  await useSportsStore.getState().fetch();
  expect(useSportsStore.getState().hosts.main.request.destination).toEqual({ type: 'live' });
  await useSportsStore.getState().fetch();
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1']);

  sportsActions.setSearch('main', 'Knicks');
  await useSportsStore.getState().fetch();
  jest
    .mocked(sportsClient.searchGames)
    .mockRejectedValueOnce(new RainbowFetchError({ message: 'Cursor expired', responseBody: { code: 9 } }));
  sportsActions.loadMore('main');
  await useSportsStore.getState().fetch();
  expect(useSportsStore.getState().hosts.main.request.cursor).toBeUndefined();
  await useSportsStore.getState().fetch();
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1']);
});

test('initial catalog admission keeps one normalized query result without a duplicate read', async () => {
  useSportsStore.setState({ catalog: undefined });
  const visibleResults: boolean[] = [];
  const stop = useSportsStore.subscribe(state => visibleResults.push(getSportsResult(state, 'main') !== null));
  try {
    sportsActions.setHostVisibility('main', true);
    await useSportsStore.getState().fetch();
    expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(1);
    expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['1']);
    expect(Object.keys(useSportsStore.getState().queryCache)).toHaveLength(1);
    const firstResult = visibleResults.indexOf(true);
    expect(firstResult).toBeGreaterThanOrEqual(0);
    expect(visibleResults.slice(firstResult)).not.toContain(false);
  } finally {
    stop();
  }
});

test('Search refresh retains accumulated content until page one replaces it', async () => {
  sportsActions.setSearch('main', 'Knicks');
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch();
  jest.mocked(sportsClient.searchGames).mockResolvedValueOnce({ catalog, games: [second] });
  sportsActions.loadMore('main');
  await useSportsStore.getState().fetch();
  const accumulated = getSportsResult(useSportsStore.getState(), 'main');
  expect(accumulated?.gameIds).toEqual(['1', '2']);
  let complete!: (response: GetGamesResponse) => void;
  jest.mocked(sportsClient.searchGames).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        complete = resolve;
      })
  );
  const refreshing = sportsActions.refresh('main');
  expect(getSportsResult(useSportsStore.getState(), 'main')).toBe(accumulated);
  complete({ catalog, games: [second] });
  await refreshing;
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['2']);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
  expect(Object.values(useSportsStore.getState().queryCache).filter(entry => entry?.data)).toHaveLength(1);
});

test('a newer lookup catalog replaces a pending old-policy browse instead of sharing its promise', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch();
  let finishOld!: (response: GetGamesResponse) => void;
  jest.mocked(sportsClient.getLiveGames).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishOld = resolve;
      })
  );
  const oldRead = useSportsStore.getState().fetch(undefined, { force: true });
  let finishReplacement!: (response: GetGamesResponse) => void;
  jest.mocked(sportsClient.getLiveGames).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishReplacement = resolve;
      })
  );
  const nextCatalog = { ...catalog, revision: 2 };
  jest.mocked(sportsClient.lookupGames).mockResolvedValueOnce({
    catalog: nextCatalog,
    games: [second],
    resolved: [{ eventId: 'child', gameId: '2' }],
    unavailableEventIds: [],
  });
  sportsActions.setExactConsumer(owner, ['child'], ['child']);
  await useSportsLookupStore.getState().fetch(undefined, { force: true });
  expect(getSportsResult(useSportsStore.getState(), 'main')).toBeNull();
  const replacement = useSportsStore.getState().fetch();
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(3);
  finishReplacement({ catalog: nextCatalog, games: [second] });
  await replacement;
  finishOld({ catalog, games: [first] });
  await oldRead;
  expect(getSportsResult(useSportsStore.getState(), 'main')?.gameIds).toEqual(['2']);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});
