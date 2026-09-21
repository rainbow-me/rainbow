import { Game, SportsCatalog, type GetGamesResponse, type LookupGamesResponse } from '@/features/sports/core/generated/sports';
import { sportsClient } from '@/features/sports/data/api/client';
import { sportsActions, useSportsLookupStore, useSportsStore } from '@/features/sports/data/sportsStore';
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
  useSportsStore.setState({ catalog, games: {}, eventGames: {}, hosts: initial.hosts, exactConsumers: new Map() });
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
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1']);
  const game = useSportsStore.getState().games['1'];
  const result = useSportsStore.getState().hosts.main.result;
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [Game.fromJSON(first)] });
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(useSportsStore.getState().games['1']).toBe(game);
  expect(useSportsStore.getState().hosts.main.result).toBe(result);

  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog, games: [] });
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual([]);
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
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1']);
  expect(useSportsStore.getState().hosts.predictions.result?.gameIds).toEqual(['2']);
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
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['2']);
  expect(useSportsStore.getState().games['1']).toBeUndefined();
});

test('exact child resolution shares Games without adding browse membership', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch(undefined, { force: true });
  sportsActions.setExactConsumer(owner, ['unsupported', 'child', 'child'], true);
  await useSportsLookupStore.getState().fetch(undefined, { force: true });
  expect(sportsClient.lookupGames).toHaveBeenLastCalledWith({ eventIds: ['child', 'unsupported'] }, expect.any(AbortController));
  expect(useSportsStore.getState().eventGames).toEqual({ child: '1', unsupported: null });
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1']);
  sportsActions.releaseHost('main');
  expect(useSportsStore.getState().games['1']).toBeDefined();
  sportsActions.setExactConsumer(owner, ['child', 'unsupported'], false);
  expect(useSportsLookupStore.getState().enabled).toBe(false);
  expect(useSportsStore.getState().games['1']).toBeDefined();
  sportsActions.removeExactConsumer(owner);
  expect(useSportsStore.getState().games).toEqual({});
  expect(useSportsStore.getState().eventGames).toEqual({});
});

test('lookup completion after its consumer leaves cannot retain orphan Games', async () => {
  let finish!: (response: LookupGamesResponse) => void;
  jest.mocked(sportsClient.lookupGames).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  sportsActions.setExactConsumer(owner, ['child'], true);
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
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1', '2']);
  await useSportsStore.getState().fetch(undefined, { force: true });
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1', '2']);
  sportsActions.setSearch('main', 'Spurs');
  expect(useSportsStore.getState().hosts.main.result).toBeNull();
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
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1']);
});

test('reopening a released Search starts at page one despite recent query metadata', async () => {
  sportsActions.setSearch('predictions', 'Knicks');
  sportsActions.setHostVisibility('predictions', true);
  await useSportsStore.getState().fetch();
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [second] });
  sportsActions.loadMore('predictions');
  await useSportsStore.getState().fetch();
  expect(useSportsStore.getState().hosts.predictions.result?.gameIds).toEqual(['1', '2']);

  sportsActions.releaseHost('predictions');
  expect(useSportsStore.getState().hosts.predictions.request.cursor).toBeUndefined();
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog, games: [first] });
  sportsActions.setHostVisibility('predictions', true);
  await useSportsStore.getState().fetch();
  expect(sportsClient.searchGames).toHaveBeenLastCalledWith(
    expect.objectContaining({ query: 'Knicks', cursor: undefined }),
    expect.any(AbortController)
  );
  expect(useSportsStore.getState().hosts.predictions.result?.gameIds).toEqual(['1']);
});

test('returning to a discarded destination fetches its Games again', async () => {
  sportsActions.setHostVisibility('main', true);
  await useSportsStore.getState().fetch();
  sportsActions.selectDestination('main', { type: 'scope', scopeId: 'tennis' });
  await useSportsStore.getState().fetch();
  sportsActions.selectDestination('main', { type: 'live' });
  await useSportsStore.getState().fetch();
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1']);
  expect(sportsClient.getLiveGames).toHaveBeenCalledTimes(2);
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
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1']);

  sportsActions.setSearch('main', 'Knicks');
  await useSportsStore.getState().fetch();
  jest
    .mocked(sportsClient.searchGames)
    .mockRejectedValueOnce(new RainbowFetchError({ message: 'Cursor expired', responseBody: { code: 9 } }));
  sportsActions.loadMore('main');
  await useSportsStore.getState().fetch();
  expect(useSportsStore.getState().hosts.main.request.cursor).toBeUndefined();
  await useSportsStore.getState().fetch();
  expect(useSportsStore.getState().hosts.main.result?.gameIds).toEqual(['1']);
});
