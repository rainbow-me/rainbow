import {
  Game_Interruption,
  Game_Status,
  ScoreColumn_Kind,
  ScoreColumn_Winner,
  type GetGamesResponse,
} from '@/features/sports/core/generated/sports';
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
  jest
    .mocked(getPlatformClient)
    .mockReturnValue(new RainbowFetchClient({ baseURL: 'https://platform.test/v1', headers: { Authorization: 'Bearer test-key' } }));
});

test('encodes repeated event IDs and search values without changing authentication', async () => {
  mockFetch
    .mockResolvedValueOnce(
      new Response('{"catalogRevision":3,"games":[],"resolved":[],"unavailableEventIds":[]}', {
        headers: { 'Content-Type': 'application/json' },
      })
    )
    .mockResolvedValueOnce(new Response('{"catalogRevision":3,"games":[]}', { headers: { 'Content-Type': 'application/json' } }));
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

test('preserves score presence and selection identity in the JSON response', async () => {
  const tokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063880';
  const body: GetGamesResponse = {
    catalogRevision: 3,
    catalog: { sports: [], prominentScopeIds: [], liveGroupIds: [], promotedGameIds: [] },
    games: [
      {
        id: '980512',
        competitionIds: [],
        status: Game_Status.STATUS_LIVE,
        interruption: Game_Interruption.INTERRUPTION_UNSPECIFIED,
        period: 'SET 3',
        clock: '54:09',
        participants: [
          { id: '1', name: 'First', winner: { eventId: '980884', marketId: '4322152', tokenId, outcomeIndex: 0 } },
          { id: '2', name: 'Second' },
        ],
        score: [
          {
            kind: ScoreColumn_Kind.KIND_SET,
            first: { value: 7, tieBreak: 8 },
            second: { value: 6, tieBreak: 6 },
            winner: ScoreColumn_Winner.WINNER_FIRST,
          },
          {
            kind: ScoreColumn_Kind.KIND_SET,
            first: { value: 0, tieBreak: 0 },
            second: { value: 1 },
            winner: ScoreColumn_Winner.WINNER_UNSPECIFIED,
          },
        ],
      },
    ],
  };
  mockFetch.mockResolvedValueOnce(new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } }));

  const response = await sportsClient.getGames({ scopeId: 'tennis', window }, null);
  const url = new URL(String(mockFetch.mock.calls[0][0]));
  expect(Object.fromEntries(url.searchParams)).toEqual({
    scopeId: 'tennis',
    from: '2026-11-01T04:00:00.000Z',
    todayUntil: '2026-11-02T05:00:00.000Z',
    until: '2026-11-08T05:00:00.000Z',
  });
  expect(response).toEqual(body);
  expect(response.games[0].score[1].second).not.toHaveProperty('tieBreak');
});
