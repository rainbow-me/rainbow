import { getSportsWindow } from './browse';
import { buildSportsCatalog } from './catalog';
import { Game, Game_Status, Sport_Browse, SportsCatalog } from './generated/sports';
import { groupSportsGames, selectSportsGames } from './sections';

const window = getSportsWindow(new Date(2026, 8, 20, 12));
const catalogMessage = SportsCatalog.fromJSON({
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
});
const catalog = buildSportsCatalog(catalogMessage, 1);

function game(id: string, fields: Partial<Game> = {}): Game {
  return Game.fromJSON({
    id,
    competitionIds: ['atp'],
    startsAt: new Date(2026, 8, 20, 15).toISOString(),
    status: Game_Status.STATUS_LIVE,
    ...fields,
  });
}

describe('Sports sections', () => {
  it('groups an ordered response without changing its order within each section', () => {
    const games = [
      game('promoted', { startsAt: new Date(2026, 8, 20, 18).toISOString() }),
      game('today', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 20, 14).toISOString() }),
      game('live'),
      game('tomorrow', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 21).toISOString() }),
    ];
    const promoted = buildSportsCatalog({ ...catalogMessage, promotedGameIds: ['promoted'] }, 1);
    const selection = groupSportsGames(promoted, games, { scopeId: 'tennis', window });

    expect(selection).toEqual([
      { type: 'live', gameIds: ['promoted', 'live'] },
      { type: 'today', gameIds: ['today'] },
      { type: 'upcoming', gameIds: ['tomorrow'] },
    ]);
  });

  it('groups live games under the first matching Live group', () => {
    const games = [
      game('basketball-match', { competitionIds: ['nba'] }),
      game('tennis-match', { competitionIds: ['us-open', 'atp'] }),
      game('scheduled', { status: Game_Status.STATUS_SCHEDULED }),
    ];

    expect(selectSportsGames(catalog, games)).toEqual([
      { type: 'live', scopeId: 'tennis', gameIds: ['tennis-match'] },
      { type: 'live', scopeId: 'nba', gameIds: ['basketball-match'] },
    ]);
  });

  it('shows only Games belonging to catalogued Live groups', () => {
    const known = game('known');
    const unknown = game('unknown', { competitionIds: ['unlisted'] });
    const selected = selectSportsGames(catalog, [known, unknown]);

    expect(selected).toEqual([{ type: 'live', scopeId: 'tennis', gameIds: ['known'] }]);
    expect(selectSportsGames(undefined, [known])).toEqual([]);
  });

  it('uses the preferred competition for uncurated Live games, ordered by the catalog', () => {
    const games = [
      game('wta-match', { competitionIds: ['wta', 'atp'] }),
      game('atp-match'),
      game('tournament-match', { competitionIds: ['us-open', 'atp'] }),
    ];

    expect(selectSportsGames(buildSportsCatalog({ ...catalogMessage, liveGroupIds: ['us-open'] }, 1), games)).toEqual([
      { type: 'live', scopeId: 'us-open', gameIds: ['tournament-match'] },
      { type: 'live', scopeId: 'atp', gameIds: ['atp-match'] },
      { type: 'live', scopeId: 'wta', gameIds: ['wta-match'] },
    ]);
  });

  it('chooses the first curated Live group even when its competition is not first on the game', () => {
    const games = [game('match', { competitionIds: ['atp', 'us-open'] })];

    expect(selectSportsGames(buildSportsCatalog({ ...catalogMessage, liveGroupIds: ['us-open', 'tennis'] }, 1), games)).toEqual([
      { type: 'live', scopeId: 'us-open', gameIds: ['match'] },
    ]);
  });

  it('orders games by promotion, then start, then ID', () => {
    const at = (hour: number): string => new Date(2026, 8, 20, hour).toISOString();
    const games = [
      game('late', { startsAt: at(18) }),
      game('b-early', { startsAt: at(9) }),
      game('a-early', { startsAt: at(9) }),
      game('promoted-second', { startsAt: at(8) }),
      game('promoted-first', { startsAt: at(20) }),
    ];
    const promoted = buildSportsCatalog({ ...catalogMessage, promotedGameIds: ['promoted-first', 'promoted-second'] }, 1);

    expect(selectSportsGames(promoted, games, { scopeId: 'tennis', window })).toEqual([
      { type: 'live', gameIds: ['promoted-first', 'promoted-second', 'a-early', 'b-early', 'late'] },
    ]);
  });

  it('caps each section at thirty', () => {
    const games = Array.from({ length: 31 }, (_, index) => [
      game(`live-${String(index).padStart(2, '0')}`),
      game(`today-${String(index).padStart(2, '0')}`, { status: Game_Status.STATUS_SCHEDULED }),
    ]).flat();
    const sections = selectSportsGames(catalog, games, { scopeId: 'tennis', window });

    expect(sections.map(section => [section.type, section.gameIds.length])).toEqual([
      ['live', 30],
      ['today', 30],
    ]);
    expect(sections.flatMap(section => section.gameIds)).not.toContain('live-30');
  });

  it('shows the games of a scope and of its competitions', () => {
    const games = [game('atp-match'), game('wta-match', { competitionIds: ['wta'] }), game('nba-match', { competitionIds: ['nba'] })];

    expect(selectSportsGames(catalog, games, { scopeId: 'tennis', window })).toEqual([
      { type: 'live', gameIds: ['atp-match', 'wta-match'] },
    ]);
    expect(selectSportsGames(catalog, games, { scopeId: 'wta', window })).toEqual([{ type: 'live', gameIds: ['wta-match'] }]);
  });

  it('shows only live games for a sport browsed by competition', () => {
    const games = [
      game('live', { competitionIds: ['epl'] }),
      game('scheduled', { competitionIds: ['epl'], status: Game_Status.STATUS_SCHEDULED }),
    ];

    expect(selectSportsGames(catalog, games, { scopeId: 'soccer', window })).toEqual([{ type: 'live', gameIds: ['live'] }]);
    expect(selectSportsGames(catalog, games, { scopeId: 'epl', window })).toEqual([
      { type: 'live', gameIds: ['live'] },
      { type: 'today', gameIds: ['scheduled'] },
    ]);
  });

  it('uses local calendar boundaries without inferring Live from a past kickoff', () => {
    const scheduled = (id: string, date: Date): Game => game(id, { status: Game_Status.STATUS_SCHEDULED, startsAt: date.toISOString() });
    const games = [
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
    ];

    expect(selectSportsGames(catalog, games, { scopeId: 'tennis', window })).toEqual([
      { type: 'live', gameIds: ['overnight-live'] },
      { type: 'today', gameIds: ['past-kickoff', 'tonight'] },
      { type: 'upcoming', gameIds: ['tomorrow', 'last-day'] },
    ]);
  });
});
