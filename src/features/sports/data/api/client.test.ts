import { afterAll, beforeEach, expect, test, vi } from 'vitest';

import { GameInterruption, GameStatus, ScoreColumnKind, ScoreColumnWinner } from '@/features/sports/core/generated/external/sports/payload';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

import { sportsClient } from './client';

vi.mock('@/resources/platform/client', () => ({ getPlatformClient: vi.fn() }));

// New York's fall-back week begins with a 25-hour local day.
const window = {
  windowStartTime: Date.UTC(2026, 10, 1, 4),
  todayCutoffTime: Date.UTC(2026, 10, 2, 5),
  windowEndTime: Date.UTC(2026, 10, 8, 5),
};
const mockFetch = vi.spyOn(global, 'fetch');
afterAll(() => {
  mockFetch.mockRestore();
});

beforeEach(() => {
  mockFetch.mockReset();
  vi.mocked(getPlatformClient).mockReturnValue(
    new RainbowFetchClient({ baseURL: 'https://platform.test/v1', headers: { Authorization: 'Bearer test-key' } })
  );
});

test('encodes repeated event IDs and search values without changing authentication', async () => {
  mockFetch
    .mockResolvedValueOnce(
      new Response('{"result":{"catalogRevision":3,"games":[],"eventGameMappings":[],"unavailableEventIds":[]}}', {
        headers: { 'Content-Type': 'application/json' },
      })
    )
    .mockResolvedValueOnce(
      new Response('{"result":{"catalogRevision":3,"games":[]}}', { headers: { 'Content-Type': 'application/json' } })
    );
  const lookup = await sportsClient.getGamesForEvents({ eventIds: ['980512', '980884'], knownCatalogRevision: 3 }, null);
  const search = await sportsClient.searchGames({ query: 'Fulham & Manchester', window, pageToken: 'next +/=' }, null);
  expect(lookup).toEqual({ catalogRevision: 3, games: [], eventGameMappings: [], unavailableEventIds: [] });
  expect(search).toEqual({ catalogRevision: 3, games: [] });

  const urls = mockFetch.mock.calls.map(([url]) => new URL(String(url)));
  expect(urls[0].pathname).toBe('/v1/sports/games/lookup');
  expect(urls[0].searchParams.getAll('eventIds')).toEqual(['980512', '980884']);
  expect(urls[0].searchParams.get('knownCatalogRevision')).toBe('3');
  expect(urls[1].pathname).toBe('/v1/sports/search');
  expect(Object.fromEntries(urls[1].searchParams)).toEqual({
    query: 'Fulham & Manchester',
    windowStartTime: '2026-11-01T04:00:00.000Z',
    windowEndTime: '2026-11-08T05:00:00.000Z',
    pageToken: 'next +/=',
  });
  expect(mockFetch.mock.calls[1][1]?.headers).toMatchObject({ Authorization: 'Bearer test-key' });
});

test.each(['getCatalog', 'listLiveGames'] as const)('unwraps the %s response', async method => {
  const result = method === 'getCatalog' ? { catalogRevision: 3 } : { catalogRevision: 3, games: [] };
  mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ result }), { headers: { 'Content-Type': 'application/json' } }));

  expect(await sportsClient[method]({ knownCatalogRevision: 3 }, null)).toEqual(result);
});

test('preserves score presence and outcome identity in the JSON response', async () => {
  const tokenId = '61682588409713156892865066024379723903051700030517382076759724382208757063880';
  const body = {
    catalogRevision: 3,
    catalog: { sports: [], prominentScopeIds: [], liveGroupIds: [], promotedGameIds: [] },
    games: [
      {
        id: '980512',
        competitionIds: [],
        status: 'GAME_STATUS_LIVE',
        interruption: 'GAME_INTERRUPTION_UNSPECIFIED',
        period: 'SET 3',
        clock: '54:09',
        participants: [
          { id: '1', name: 'First', moneylineOutcome: { eventId: '980884', marketId: '4322152', tokenId, outcomeIndex: 0, priceUsd: '0' } },
          { id: '2', name: 'Second' },
        ],
        scoreColumns: [
          {
            kind: 'SCORE_COLUMN_KIND_SET',
            first: { value: 7, tieBreak: 8 },
            second: { value: 6, tieBreak: 6 },
            winner: 'SCORE_COLUMN_WINNER_FIRST',
          },
          {
            kind: 'SCORE_COLUMN_KIND_SET',
            first: { value: 0, tieBreak: 0 },
            second: { value: 1 },
            winner: 'SCORE_COLUMN_WINNER_UNSPECIFIED',
          },
        ],
      },
    ],
  };
  mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ result: body }), { headers: { 'Content-Type': 'application/json' } }));

  const response = await sportsClient.listGames({ scopeId: 'tennis', window }, null);
  const url = new URL(String(mockFetch.mock.calls[0][0]));
  expect(Object.fromEntries(url.searchParams)).toEqual({
    scopeId: 'tennis',
    windowStartTime: '2026-11-01T04:00:00.000Z',
    todayCutoffTime: '2026-11-02T05:00:00.000Z',
    windowEndTime: '2026-11-08T05:00:00.000Z',
  });
  expect(response).toEqual(body);
  expect(response.games[0].status).toBe(GameStatus.GAME_STATUS_LIVE);
  expect(response.games[0].interruption).toBe(GameInterruption.GAME_INTERRUPTION_UNSPECIFIED);
  expect(response.games[0].scoreColumns[0].kind).toBe(ScoreColumnKind.SCORE_COLUMN_KIND_SET);
  expect(response.games[0].scoreColumns[0].winner).toBe(ScoreColumnWinner.SCORE_COLUMN_WINNER_FIRST);
  expect(response.games[0].scoreColumns[1].second).not.toHaveProperty('tieBreak');
});
