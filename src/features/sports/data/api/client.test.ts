import { Game_Status, ScoreColumn_Kind, ScoreColumn_Winner } from '@/features/sports/core/generated/sports';
import { RainbowFetchClient, RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

import { sportsClient } from './client';

jest.mock('@/resources/platform/client', () => ({ getPlatformClient: jest.fn() }));
jest.mock('@/config/debug', () => ({
  get sportsApiBaseUrl() {
    return mockSportsApiBaseUrl;
  },
}));

const originalDev = __DEV__;
let mockSportsApiBaseUrl = '';
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  Object.assign(global, { __DEV__: true });
  mockSportsApiBaseUrl = '';
  mockFetch.mockReset();
  mockFetch.mockImplementation(async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
  jest
    .mocked(getPlatformClient)
    .mockReturnValue(new RainbowFetchClient({ baseURL: 'https://platform.test/v1', headers: { Authorization: 'Bearer test-key' } }));
});

afterEach(() => {
  Object.assign(global, { __DEV__: originalDev });
});

test('uses the local Sports URL only in Debug and retains platform authentication', async () => {
  mockSportsApiBaseUrl = 'http://127.0.0.1:8082';
  const controller = new AbortController();
  await sportsClient.getCatalog(controller);
  expect(mockFetch.mock.calls[0][0]).toBe('http://127.0.0.1:8082/v1/sports/catalog');
  expect(mockFetch.mock.calls[0][1]).toMatchObject({ headers: { Authorization: 'Bearer test-key' }, signal: controller.signal });
  expect(getPlatformClient().baseURL).toBe('https://platform.test/v1');

  Object.assign(global, { __DEV__: false });
  await sportsClient.getCatalog(null);
  expect(mockFetch.mock.calls[1][0]).toBe('https://platform.test/v1/sports/catalog');
});

test('uses the five Sports routes and preserves query values and cancellation', async () => {
  const controller = new AbortController();
  const window = { from: '2026-09-20T04:00:00Z', until: '2026-09-27T04:00:00Z' };

  await sportsClient.getCatalog(controller);
  await sportsClient.getLiveGames({}, controller);
  await sportsClient.getLiveGames({ scopeId: 'nba' }, controller);
  await sportsClient.getGames({ scopeId: 'nba', ...window }, controller);
  await sportsClient.lookupGames({ eventIds: ['980512', '980884', '980512'] }, controller);
  await sportsClient.searchGames({ query: 'Fulham & Manchester', scopeId: 'soccer', ...window, cursor: 'next +/=' }, controller);
  await sportsClient.searchGames({ query: 'tennis', from: undefined, until: undefined }, controller);

  expect(mockFetch.mock.calls.map(([url]) => url)).toEqual([
    'https://platform.test/v1/sports/catalog',
    'https://platform.test/v1/sports/live',
    'https://platform.test/v1/sports/live?scopeId=nba',
    'https://platform.test/v1/sports/games?scopeId=nba&from=2026-09-20T04%3A00%3A00Z&until=2026-09-27T04%3A00%3A00Z',
    'https://platform.test/v1/sports/games/lookup?eventIds=980512&eventIds=980884&eventIds=980512',
    'https://platform.test/v1/sports/search?query=Fulham+%26+Manchester&scopeId=soccer&from=2026-09-20T04%3A00%3A00Z&until=2026-09-27T04%3A00%3A00Z&cursor=next+%2B%2F%3D',
    'https://platform.test/v1/sports/search?query=tennis',
  ]);
  for (const [, options] of mockFetch.mock.calls) {
    expect(options.method).toBe('get');
    expect(options.signal).toBe(controller.signal);
  }
});

test('decodes structured scores and omitted protobuf zero values directly', async () => {
  const tokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063880';
  mockFetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        catalog: { revision: 3 },
        games: [
          {
            id: '980512',
            status: 'STATUS_LIVE',
            period: 'SET 3',
            clock: '54:09',
            participants: [
              { id: '1', name: 'First', winner: { eventId: '980884', marketId: '4322152', tokenId } },
              { id: '2', name: 'Second' },
            ],
            score: [
              { kind: 'KIND_SET', first: { value: 7, tieBreak: 8 }, second: { value: 6, tieBreak: 6 }, winner: 'WINNER_FIRST' },
              { kind: 'KIND_SET', first: {}, second: { value: 1 } },
            ],
          },
        ],
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  );

  const response = await sportsClient.getGames({ scopeId: 'tennis', from: undefined, until: undefined }, null);
  expect(response.catalog?.revision).toBe(3);
  expect(response.games[0]).toMatchObject({ id: '980512', status: Game_Status.STATUS_LIVE, period: 'SET 3', clock: '54:09' });
  expect(response.games[0].score).toEqual([
    {
      kind: ScoreColumn_Kind.KIND_SET,
      first: { value: 7, tieBreak: 8 },
      second: { value: 6, tieBreak: 6 },
      winner: ScoreColumn_Winner.WINNER_FIRST,
    },
    {
      kind: ScoreColumn_Kind.KIND_SET,
      first: { value: 0, tieBreak: undefined },
      second: { value: 1, tieBreak: undefined },
      winner: ScoreColumn_Winner.WINNER_UNSPECIFIED,
    },
  ]);
  expect(response.games[0].participants[0].winner).toEqual({ eventId: '980884', marketId: '4322152', tokenId, outcomeIndex: 0 });
});

test('preserves platform HTTP errors and abort errors', async () => {
  mockFetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ error: 'Unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
  );
  await expect(sportsClient.getCatalog(null)).rejects.toMatchObject({
    name: 'RainbowFetchError',
    response: { status: 503 },
    responseBody: { error: 'Unavailable' },
  });

  const platformError = new RainbowFetchError({ message: 'Network request failed' });
  jest.spyOn(getPlatformClient(), 'get').mockRejectedValueOnce(platformError);
  await expect(sportsClient.getCatalog(null)).rejects.toBe(platformError);

  const abortError = new Error('Aborted');
  abortError.name = 'AbortError';
  mockFetch.mockRejectedValueOnce(abortError);
  await expect(sportsClient.getCatalog(null)).rejects.toBe(abortError);
});
