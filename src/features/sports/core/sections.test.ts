import { Game, Game_Status, Sport_Browse, SportsCatalog } from './generated/sports';
import { getSportsDirectoryCounts, getSportsSections } from './sections';

const now = new Date(2026, 8, 20, 12);
const catalog = SportsCatalog.fromJSON({
  revision: 1,
  sports: [
    {
      id: 'tennis',
      browse: Sport_Browse.BROWSE_GAMES,
      competitions: [{ id: 'atp' }, { id: 'us-open' }, { id: 'wta' }],
    },
    { id: 'basketball', browse: Sport_Browse.BROWSE_GAMES, competitions: [{ id: 'nba' }] },
    { id: 'soccer', browse: Sport_Browse.BROWSE_COMPETITIONS, competitions: [{ id: 'epl' }] },
  ],
  liveGroupIds: ['tennis', 'us-open'],
  promotedGameIds: ['promoted-second', 'promoted-first'],
});

function game(id: string, fields: Partial<Game> = {}): Game {
  return Game.fromJSON({
    id,
    competitionIds: ['atp'],
    startsAt: new Date(2026, 8, 20, 15).toISOString(),
    status: Game_Status.STATUS_LIVE,
    ...fields,
  });
}

function gamesById(...games: Game[]): Record<string, Game> {
  return Object.fromEntries(games.map(game => [game.id, game]));
}

describe('Sports sections', () => {
  it('groups duplicate memberships once under the first matching Live group', () => {
    const games = gamesById(
      game('tennis-match', { competitionIds: ['us-open', 'atp'] }),
      game('basketball-match', { competitionIds: ['nba'] }),
      game('scheduled', { status: Game_Status.STATUS_SCHEDULED }),
      game('lookup-only')
    );

    expect(
      getSportsSections({
        catalog,
        games,
        gameIds: ['basketball-match', 'tennis-match', 'tennis-match', 'scheduled', 'missing'],
        destination: { type: 'live' },
        now,
      })
    ).toEqual([
      { type: 'live', scopeId: 'tennis', gameIds: ['tennis-match'] },
      { type: 'live', scopeId: 'nba', gameIds: ['basketball-match'] },
    ]);
  });

  it('uses preferred competition for uncurated Live games, ordered by the catalog', () => {
    expect(
      getSportsSections({
        catalog: { ...catalog, liveGroupIds: ['us-open'] },
        games: gamesById(
          game('wta-match', { competitionIds: ['wta', 'atp'] }),
          game('atp-match'),
          game('tournament-match', { competitionIds: ['us-open', 'atp'] })
        ),
        gameIds: ['wta-match', 'atp-match', 'tournament-match'],
        destination: { type: 'live' },
        now,
      })
    ).toEqual([
      { type: 'live', scopeId: 'us-open', gameIds: ['tournament-match'] },
      { type: 'live', scopeId: 'atp', gameIds: ['atp-match'] },
      { type: 'live', scopeId: 'wta', gameIds: ['wta-match'] },
    ]);
  });

  it('uses local calendar boundaries without inferring Live from a past kickoff', () => {
    const scheduled = (id: string, date: Date) => game(id, { status: Game_Status.STATUS_SCHEDULED, startsAt: date.toISOString() });
    const games = gamesById(
      scheduled('before-today', new Date(2026, 8, 19, 23, 59, 59, 999)),
      scheduled('past-kickoff', new Date(2026, 8, 20)),
      scheduled('tonight', new Date(2026, 8, 20, 23, 59, 59, 999)),
      scheduled('tomorrow', new Date(2026, 8, 21)),
      scheduled('last-day', new Date(2026, 8, 26, 23, 59, 59, 999)),
      scheduled('outside-window', new Date(2026, 8, 27)),
      game('missing-start', { status: Game_Status.STATUS_SCHEDULED, startsAt: undefined }),
      game('overnight-live', { startsAt: new Date(2026, 8, 19, 23).toISOString() }),
      game('finished', { status: Game_Status.STATUS_ENDED }),
      game('unknown', { status: Game_Status.STATUS_UNSPECIFIED }),
      game('different-scope', { competitionIds: ['nba'] })
    );

    expect(
      getSportsSections({ catalog, games, gameIds: Object.keys(games), destination: { type: 'scope', scopeId: 'tennis' }, now })
    ).toEqual([
      { type: 'live', gameIds: ['overnight-live'] },
      { type: 'today', gameIds: ['past-kickoff', 'tonight'] },
      { type: 'upcoming', gameIds: ['tomorrow', 'last-day'] },
    ]);
  });

  it('orders browse games by promotion rank, kickoff, then ID, retaining the full collapsed section', () => {
    const games = gamesById(
      game('b'),
      game('a'),
      game('earlier', { startsAt: new Date(2026, 8, 20, 10).toISOString() }),
      game('promoted-first'),
      game('promoted-second')
    );
    const gameIds = Object.keys(games);
    const sections = getSportsSections({ catalog, games, gameIds, destination: { type: 'scope', scopeId: 'atp' }, now });

    expect(sections).toEqual([{ type: 'live', gameIds: ['promoted-second', 'promoted-first', 'earlier', 'a', 'b'] }]);
    expect(sections[0].gameIds.slice(0, 2)).toHaveLength(2);
    expect(getSportsDirectoryCounts({ catalog, games, gameIds }).atp).toBe(5);
    expect(gameIds).toEqual(['b', 'a', 'earlier', 'promoted-first', 'promoted-second']);
  });

  it('leaves All Sports as a directory and competition-directory sports with only Live', () => {
    const games = gamesById(
      game('live', { competitionIds: ['epl'] }),
      game('scheduled', { competitionIds: ['epl'], status: Game_Status.STATUS_SCHEDULED })
    );
    const input = { catalog, games, gameIds: Object.keys(games), now };

    expect(getSportsSections({ ...input, destination: { type: 'all' } })).toEqual([]);
    expect(getSportsSections({ ...input, destination: { type: 'scope', scopeId: 'soccer' } })).toEqual([
      { type: 'live', gameIds: ['live'] },
    ]);
    expect(getSportsSections({ ...input, destination: { type: 'scope', scopeId: 'epl' } })).toEqual([
      { type: 'live', gameIds: ['live'] },
      { type: 'today', gameIds: ['scheduled'] },
    ]);
  });

  it('preserves Search relevance and returned statuses without browse sorting', () => {
    expect(
      getSportsSections({
        catalog,
        games: gamesById(
          game('finished', { status: Game_Status.STATUS_ENDED }),
          game('live'),
          game('promoted-first'),
          game('postponed', { status: Game_Status.STATUS_POSTPONED })
        ),
        gameIds: ['finished', 'live', 'promoted-first', 'missing', 'postponed', 'live'],
        destination: { type: 'all' },
        search: true,
        now,
      })
    ).toEqual([{ type: 'search', gameIds: ['finished', 'live', 'promoted-first', 'postponed'] }]);
  });
});

describe('Sports directory counts', () => {
  it('unions supplied browse and Search IDs, without counting lookup-only games or duplicate memberships', () => {
    const games = gamesById(
      game('browse', { competitionIds: ['us-open', 'atp', 'atp'] }),
      game('search-ended', { status: Game_Status.STATUS_ENDED }),
      game('search-later', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 9, 20).toISOString() }),
      game('lookup-only', { competitionIds: ['nba'] })
    );
    const browseIds = ['browse'];
    const searchIds = ['browse', 'search-ended', 'search-later', 'missing'];

    expect(getSportsDirectoryCounts({ catalog, games, gameIds: [...browseIds, ...searchIds] })).toEqual({
      'tennis': 3,
      'atp': 3,
      'us-open': 1,
      'wta': 0,
      'basketball': 0,
      'nba': 0,
      'soccer': 0,
      'epl': 0,
    });
  });
});
