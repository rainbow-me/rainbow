import { Game_Status, ScoreColumn_Kind, ScoreColumn_Winner } from '@/features/sports/core/generated/sports';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

import { sportsClient } from './client';

jest.mock('@/resources/platform/client', () => ({ getPlatformClient: jest.fn() }));

// New York's fall-back week begins with a 25-hour local day.
const window = { from: Date.UTC(2026, 10, 1, 4), todayUntil: Date.UTC(2026, 10, 2, 5), until: Date.UTC(2026, 10, 8, 5) };
const mockFetch = jest.spyOn(global, 'fetch');
afterAll(() => mockFetch.mockRestore());

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
  jest
    .mocked(getPlatformClient)
    .mockReturnValue(new RainbowFetchClient({ baseURL: 'https://platform.test/v1', headers: { Authorization: 'Bearer test-key' } }));
});

test('encodes repeated event IDs and search values without changing authentication', async () => {
  await sportsClient.lookupGames({ eventIds: ['980512', '980884'], knownCatalogRevision: 3 }, null);
  await sportsClient.searchGames({ query: 'Fulham & Manchester', window, cursor: 'next +/=' }, null);

  const urls = mockFetch.mock.calls.map(([url]) => new URL(String(url)));
  expect(urls[0].pathname).toBe('/v1/sports/games/lookup');
  expect(urls[0].searchParams.getAll('eventIds')).toEqual(['980512', '980884']);
  expect(urls[0].searchParams.get('knownCatalogRevision')).toBe('3');
  expect(urls[1].pathname).toBe('/v1/sports/search');
  expect(Object.fromEntries(urls[1].searchParams)).toEqual({
    query: 'Fulham & Manchester',
    from: '2026-11-01T04:00:00.000Z',
    until: '2026-11-08T05:00:00.000Z',
    cursor: 'next +/=',
  });
  expect(mockFetch.mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'Bearer test-key' });
});

test('decodes structured scores and omitted protobuf zero values directly', async () => {
  const tokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063880';
  mockFetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        catalogRevision: 3,
        catalog: {},
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

  const response = await sportsClient.getGames({ scopeId: 'tennis', window }, null);
  const url = new URL(String(mockFetch.mock.calls[0][0]));
  expect(Object.fromEntries(url.searchParams)).toEqual({
    scopeId: 'tennis',
    from: '2026-11-01T04:00:00.000Z',
    todayUntil: '2026-11-02T05:00:00.000Z',
    until: '2026-11-08T05:00:00.000Z',
  });
  expect(response.catalogRevision).toBe(3);
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
