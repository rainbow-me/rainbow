import { buildSportsCatalog } from '@/features/sports/core/catalog';
import { Game, SportsCatalog } from '@/features/sports/core/generated/sports';
import { sportsClient } from '@/features/sports/data/api/client';
import { sportsNavigationStores, sportsReadStatusStores } from '@/features/sports/data/sportsNavigation';
import { sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
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

const response = SportsCatalog.fromJSON({
  revision: 1,
  sports: [
    { id: 'soccer', name: 'Soccer', browse: 'BROWSE_COMPETITIONS', competitions: [{ id: 'epl', name: 'Premier League' }] },
    { id: 'basketball', name: 'Basketball', browse: 'BROWSE_GAMES', competitions: [{ id: 'nba', name: 'NBA' }] },
  ],
  prominentScopeIds: ['soccer', 'nba'],
});
const scope = (scopeId: string) => ({ type: 'scope' as const, scopeId });
const settle = () =>
  new Promise<void>(resolve => {
    setImmediate(resolve);
  });
let stop: (() => void)[];

beforeEach(() => {
  useSportsStore.getState().clear();
  useSportsViewStore.setState({ ...useSportsViewStore.getInitialState(), appActive: true });
  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  jest.clearAllMocks();
  jest.mocked(sportsClient.getCatalog).mockResolvedValue(response);
  jest.mocked(sportsClient.getLiveGames).mockResolvedValue({ catalog: response, games: [] });
  jest.mocked(sportsClient.getGames).mockResolvedValue({ catalog: response, games: [] });
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog: response, games: [] });
  stop = [
    sportsNavigationStores.main.subscribe(() => undefined),
    sportsNavigationStores.predictions.subscribe(() => undefined),
    sportsReadStatusStores.main.subscribe(() => undefined),
    sportsReadStatusStores.predictions.subscribe(() => undefined),
  ];
});

afterEach(() => {
  for (const unsubscribe of stop) unsubscribe();
  sportsActions.setHostVisibility('main', false);
  sportsActions.setHostVisibility('predictions', false);
});
afterAll(() => useSportsStore.getState().reset(true));

it('keeps directory, header, selected category and Back on the same catalog relationships', () => {
  const catalog = buildSportsCatalog(response);
  useSportsStore.setState({ catalog });
  sportsActions.selectDestination('main', { type: 'all' });
  expect(sportsNavigationStores.main.getState()).toMatchObject({
    page: 'sports',
    directoryIds: ['soccer', 'basketball'],
    selectedCategory: 'all',
    back: undefined,
  });

  sportsActions.openScope('main', 'soccer');
  expect(sportsNavigationStores.main.getState()).toMatchObject({
    page: 'competitions',
    directoryIds: ['epl'],
    scope: catalog.scopes.soccer,
    parent: undefined,
    back: { type: 'all' },
    selectedCategory: 'all',
  });
  sportsActions.openScope('main', 'epl');
  expect(sportsNavigationStores.main.getState()).toMatchObject({
    page: 'games',
    directoryIds: [],
    scope: catalog.scopes.epl,
    parent: catalog.scopes.soccer,
    back: scope('soccer'),
    selectedCategory: 'all',
  });
  sportsActions.goBack('main');
  expect(sportsNavigationStores.main.getState().directoryIds).toBe(catalog.scopes.soccer?.directoryIds);
  sportsActions.goBack('main');
  expect(sportsNavigationStores.main.getState().directoryIds).toBe(catalog.sportIds);
  expect(sportsNavigationStores.main.getState().categories).toBe(catalog.categories);
});

it('searches the catalog in shared order and opens a result at its category root', () => {
  useSportsStore.setState({ catalog: buildSportsCatalog(response) });
  sportsActions.selectDestination('main', scope('soccer'));
  sportsActions.setSearch('main', 'NBA');
  expect(sportsNavigationStores.main.getState()).toMatchObject({
    page: 'search',
    directoryIds: ['nba'],
    selectedCategory: 'scope:soccer',
  });
  sportsActions.openScope('main', 'nba');
  expect(sportsNavigationStores.main.getState()).toMatchObject({ page: 'games', selectedCategory: 'scope:nba', back: undefined });
  expect(useSportsViewStore.getState().hosts.main.request.query).toBeNull();
  expect(sportsNavigationStores.predictions.getState().page).toBe('live');
});

it('does not repeat catalog search for score, request metadata, or host visibility changes', () => {
  const catalog = buildSportsCatalog(response);
  const readSearchName = jest.fn(() => 'premier league');
  Object.defineProperty(catalog.scopes.epl, 'searchName', { get: readSearchName });
  useSportsStore.setState({ catalog });
  sportsActions.setSearch('main', 'premier');
  expect(sportsNavigationStores.main.getState().directoryIds).toEqual(['epl']);
  readSearchName.mockClear();

  useSportsStore.setState({ games: { game: Game.fromJSON({ id: 'game', score: [{ first: { value: 1 } }] }) }, queryCache: {} });
  sportsActions.setHostVisibility('main', false);
  expect(sportsNavigationStores.main.getState().directoryIds).toEqual(['epl']);
  expect(readSearchName).not.toHaveBeenCalled();
});

it('shows initial loading only without available directory or result data', async () => {
  sportsActions.selectDestination('main', { type: 'all' });
  expect(sportsReadStatusStores.main.getState()).toBe('loading');
  useSportsStore.setState({ catalog: buildSportsCatalog(response) });
  expect(sportsReadStatusStores.main.getState()).toBe('none');

  sportsActions.setSearch('main', '');
  expect(sportsReadStatusStores.main.getState()).toBe('none');
  sportsActions.setSearch('main', 'nba');
  expect(sportsReadStatusStores.main.getState()).toBe('loading');
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(sportsReadStatusStores.main.getState()).toBe('search-empty');
});

it('shows each host its own query error after the active request changes', async () => {
  sportsActions.selectDestination('main', scope('nba'));
  sportsActions.setHostVisibility('main', true);
  await settle();
  expect(sportsReadStatusStores.main.getState()).toBe('empty');

  sportsActions.selectDestination('predictions', scope('epl'));
  sportsActions.setHostVisibility('predictions', true);
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN });
  jest.mocked(sportsClient.getGames).mockRejectedValue(new Error('Schedule unavailable'));
  await settle();
  expect(sportsReadStatusStores.predictions.getState()).toBe('error');
  expect(sportsReadStatusStores.main.getState()).toBe('empty');

  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  await settle();
  expect(sportsReadStatusStores.main.getState()).toBe('empty');
  expect(sportsReadStatusStores.predictions.getState()).toBe('error');
});

it('uses the same search status entry for the first page and continuation retry', async () => {
  sportsActions.setSearch('main', 'nba');
  sportsActions.setHostVisibility('main', true);
  jest.mocked(sportsClient.searchGames).mockResolvedValue({
    catalog: response,
    games: [Game.fromJSON({ id: 'first', status: 'STATUS_LIVE', competitionIds: ['nba'] })],
    nextCursor: 'page-2',
  });
  await settle();
  expect(sportsReadStatusStores.main.getState()).toBe('more');

  jest.mocked(sportsClient.searchGames).mockRejectedValue(new Error('Page unavailable'));
  await sportsActions.loadMore('main');
  expect(sportsReadStatusStores.main.getState()).toBe('error');

  jest
    .mocked(sportsClient.searchGames)
    .mockResolvedValue({ catalog: response, games: [Game.fromJSON({ id: 'second', status: 'STATUS_LIVE', competitionIds: ['nba'] })] });
  await sportsActions.retry('main');
  expect(sportsClient.searchGames).toHaveBeenLastCalledWith(
    expect.objectContaining({ query: 'nba', cursor: 'page-2' }),
    expect.any(AbortController)
  );
  expect(sportsReadStatusStores.main.getState()).toBe('none');
});

it('resolves a cold competition entry to its category after the catalog arrives', () => {
  sportsActions.selectDestination('main', scope('epl'));
  expect(sportsNavigationStores.main.getState().selectedCategory).toBe('scope:epl');

  useSportsStore.setState({ catalog: buildSportsCatalog(response) });
  expect(sportsNavigationStores.main.getState()).toMatchObject({
    page: 'games',
    selectedCategory: 'scope:soccer',
    back: scope('soccer'),
  });
  sportsActions.goBack('main');
  expect(sportsNavigationStores.main.getState()).toMatchObject({
    page: 'competitions',
    directoryIds: ['epl'],
    back: undefined,
  });
});

it('retries the host search when returning from a different failed request', async () => {
  const first = Game.fromJSON({ id: 'first', status: 'STATUS_LIVE', competitionIds: ['nba'] });
  jest.mocked(sportsClient.searchGames).mockResolvedValue({ catalog: response, games: [first], nextCursor: 'page-2' });
  sportsActions.setSearch('main', 'nba');
  sportsActions.setHostVisibility('main', true);
  await settle();

  jest
    .mocked(sportsClient.searchGames)
    .mockRejectedValueOnce(new RainbowFetchError({ message: 'Expired cursor', responseBody: { code: 9 } }));
  await sportsActions.loadMore('main');
  expect(sportsReadStatusStores.main.getState()).toBe('error');

  jest.mocked(sportsClient.getGames).mockRejectedValue(new RainbowFetchError({ message: 'Removed scope', responseBody: { code: 5 } }));
  sportsActions.selectDestination('predictions', scope('epl'));
  sportsActions.setHostVisibility('predictions', true);
  useNavigationStore.setState({ activeRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN });
  await settle();
  expect(sportsReadStatusStores.predictions.getState()).toBe('error');

  useNavigationStore.setState({ activeRoute: Routes.SPORTS_SCREEN });
  await sportsActions.retry('main');
  expect(sportsClient.searchGames).toHaveBeenLastCalledWith(
    expect.objectContaining({ query: 'nba', cursor: undefined }),
    expect.any(AbortController)
  );
  expect(sportsReadStatusStores.main.getState()).toBe('more');
});
