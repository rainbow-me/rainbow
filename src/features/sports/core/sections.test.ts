import { getSportsWindow } from './browse';
import { buildSportsCatalog } from './catalog';
import { Game, Game_Status, Sport_Browse, SportsCatalog } from './generated/sports';
import { areSectionInputsEqual, groupSportsGames, reuseSections, selectSportsGames, type SportsSection } from './sections';

const window = getSportsWindow(new Date(2026, 8, 20, 12));
const catalogResponse = SportsCatalog.fromJSON({
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
});
const catalog = buildSportsCatalog(catalogResponse);

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
    const promoted = buildSportsCatalog({ ...catalogResponse, promotedGameIds: ['promoted'] });
    const selection = groupSportsGames(promoted, games, { scopeId: 'tennis', window });

    expect(selection.sections).toEqual([
      { type: 'live', gameIds: ['promoted', 'live'] },
      { type: 'today', gameIds: ['today'] },
      { type: 'upcoming', gameIds: ['tomorrow'] },
    ]);
    expect(selection.games).toEqual([games[0], games[2], games[1], games[3]]);
  });

  it('groups live games under the first matching Live group', () => {
    const games = [
      game('basketball-match', { competitionIds: ['nba'] }),
      game('tennis-match', { competitionIds: ['us-open', 'atp'] }),
      game('scheduled', { status: Game_Status.STATUS_SCHEDULED }),
    ];

    expect(selectSportsGames(catalog, games).sections).toEqual([
      { type: 'live', scopeId: 'tennis', gameIds: ['tennis-match'] },
      { type: 'live', scopeId: 'nba', gameIds: ['basketball-match'] },
    ]);
  });

  it('admits only Games belonging to emitted sections', () => {
    const known = game('known');
    const unknown = game('unknown', { competitionIds: ['unlisted'] });
    const selected = selectSportsGames(catalog, [known, unknown]);

    expect(selected.games).toEqual([known]);
    expect(selected.sections).toEqual([{ type: 'live', scopeId: 'tennis', gameIds: ['known'] }]);
    expect(selectSportsGames(undefined, [known])).toEqual({ games: [], sections: [] });
  });

  it('uses the preferred competition for uncurated Live games, ordered by the catalog', () => {
    const games = [
      game('wta-match', { competitionIds: ['wta', 'atp'] }),
      game('atp-match'),
      game('tournament-match', { competitionIds: ['us-open', 'atp'] }),
    ];

    expect(selectSportsGames(buildSportsCatalog({ ...catalogResponse, liveGroupIds: ['us-open'] }), games).sections).toEqual([
      { type: 'live', scopeId: 'us-open', gameIds: ['tournament-match'] },
      { type: 'live', scopeId: 'atp', gameIds: ['atp-match'] },
      { type: 'live', scopeId: 'wta', gameIds: ['wta-match'] },
    ]);
  });

  it('chooses the first curated Live group even when its competition is not first on the game', () => {
    const games = [game('match', { competitionIds: ['atp', 'us-open'] })];

    expect(selectSportsGames(buildSportsCatalog({ ...catalogResponse, liveGroupIds: ['us-open', 'tennis'] }), games).sections).toEqual([
      { type: 'live', scopeId: 'us-open', gameIds: ['match'] },
    ]);
  });

  it('orders each Live group by promotion, then start, then ID', () => {
    const at = (hour: number) => new Date(2026, 8, 20, hour).toISOString();
    const games = [game('late', { startsAt: at(18) }), game('early', { startsAt: at(9) }), game('promoted', { startsAt: at(20) })];
    const promoted = buildSportsCatalog({ ...catalogResponse, promotedGameIds: ['promoted'] });

    expect(selectSportsGames(promoted, games).sections).toEqual([
      { type: 'live', scopeId: 'tennis', gameIds: ['promoted', 'early', 'late'] },
    ]);
  });

  it('orders games by promotion, then start, then ID', () => {
    const at = (hour: number) => new Date(2026, 8, 20, hour).toISOString();
    const games = [
      game('late', { startsAt: at(18) }),
      game('b-early', { startsAt: at(9) }),
      game('a-early', { startsAt: at(9) }),
      game('promoted-second', { startsAt: at(8) }),
      game('promoted-first', { startsAt: at(20) }),
    ];
    const promoted = buildSportsCatalog({ ...catalogResponse, promotedGameIds: ['promoted-first', 'promoted-second'] });

    expect(selectSportsGames(promoted, games, { scopeId: 'tennis', window }).sections).toEqual([
      { type: 'live', gameIds: ['promoted-first', 'promoted-second', 'a-early', 'b-early', 'late'] },
    ]);
  });

  it('caps each section at thirty', () => {
    const games = Array.from({ length: 31 }, (_, index) => [
      game(`live-${String(index).padStart(2, '0')}`),
      game(`today-${String(index).padStart(2, '0')}`, { status: Game_Status.STATUS_SCHEDULED }),
    ]).flat();
    const sections = selectSportsGames(catalog, games, { scopeId: 'tennis', window }).sections;

    expect(sections.map(section => [section.type, section.gameIds.length])).toEqual([
      ['live', 30],
      ['today', 30],
    ]);
    expect(sections.flatMap(section => section.gameIds)).not.toContain('live-30');
  });

  it('shows the games of a scope and of its competitions', () => {
    const games = [game('atp-match'), game('wta-match', { competitionIds: ['wta'] }), game('nba-match', { competitionIds: ['nba'] })];

    expect(selectSportsGames(catalog, games, { scopeId: 'tennis', window }).sections).toEqual([
      { type: 'live', gameIds: ['atp-match', 'wta-match'] },
    ]);
    expect(selectSportsGames(catalog, games, { scopeId: 'wta', window }).sections).toEqual([{ type: 'live', gameIds: ['wta-match'] }]);
  });

  it('shows only live games for a sport browsed by competition', () => {
    const games = [
      game('live', { competitionIds: ['epl'] }),
      game('scheduled', { competitionIds: ['epl'], status: Game_Status.STATUS_SCHEDULED }),
    ];

    expect(selectSportsGames(catalog, games, { scopeId: 'soccer', window }).sections).toEqual([{ type: 'live', gameIds: ['live'] }]);
    expect(selectSportsGames(catalog, games, { scopeId: 'epl', window }).sections).toEqual([
      { type: 'live', gameIds: ['live'] },
      { type: 'today', gameIds: ['scheduled'] },
    ]);
  });

  it('uses local calendar boundaries without inferring Live from a past kickoff', () => {
    const scheduled = (id: string, date: Date) => game(id, { status: Game_Status.STATUS_SCHEDULED, startsAt: date.toISOString() });
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

    expect(selectSportsGames(catalog, games, { scopeId: 'tennis', window }).sections).toEqual([
      { type: 'live', gameIds: ['overnight-live'] },
      { type: 'today', gameIds: ['past-kickoff', 'tonight'] },
      { type: 'upcoming', gameIds: ['tomorrow', 'last-day'] },
    ]);
  });

  it('compares only the fields sections read, for the given games', () => {
    const live = game('live');
    const scheduled = game('scheduled', { status: Game_Status.STATUS_SCHEDULED });
    const games = { live, scheduled };
    const gameIds = ['live', 'scheduled'];
    const scored = { live: { ...live, clock: '12:00' }, scheduled };
    const started = { live, scheduled: { ...scheduled, status: Game_Status.STATUS_LIVE } };
    const rescheduled = { live, scheduled: { ...scheduled, startsAt: new Date(2026, 8, 21).toISOString() } };
    const moved = { live, scheduled: { ...scheduled, competitionIds: ['wta'] } };

    expect(areSectionInputsEqual(games, scored, gameIds)).toBe(true);
    expect(areSectionInputsEqual(games, started, gameIds)).toBe(false);
    expect(areSectionInputsEqual(games, rescheduled, gameIds)).toBe(false);
    expect(areSectionInputsEqual(games, moved, gameIds)).toBe(false);
    expect(areSectionInputsEqual(games, { live }, gameIds)).toBe(false);
    expect(areSectionInputsEqual(games, started, ['live'])).toBe(true);
  });
});

describe('Section identity', () => {
  const previous: SportsSection[] = [
    { type: 'live', scopeId: 'nba', gameIds: ['a', 'b'] },
    { type: 'live', scopeId: 'nhl', gameIds: ['c'] },
  ];

  it('reuses unchanged sections when a neighbor changes or disappears', () => {
    const changed = reuseSections(previous, [
      { type: 'live', scopeId: 'nba', gameIds: ['b'] },
      { type: 'live', scopeId: 'nhl', gameIds: ['c'] },
    ]);
    expect(changed).not.toBe(previous);
    expect(changed[0].gameIds).toEqual(['b']);
    expect(changed[1]).toBe(previous[1]);
    expect(changed[1].gameIds).toBe(previous[1].gameIds);

    const removed = reuseSections(changed, [{ type: 'live', scopeId: 'nhl', gameIds: ['c'] }]);
    expect(removed[0]).toBe(previous[1]);
    expect(previous[0].gameIds).toEqual(['a', 'b']);
  });

  it('reuses the array only when every section remains in the same position', () => {
    const same = reuseSections(
      previous,
      previous.map(section => ({ ...section, gameIds: [...section.gameIds] }))
    );
    expect(same).toBe(previous);

    const reordered = reuseSections(previous, [
      { type: 'live', scopeId: 'nhl', gameIds: ['c'] },
      { type: 'live', scopeId: 'nba', gameIds: ['a', 'b'] },
    ]);
    expect(reordered).not.toBe(previous);
    expect(reordered[0]).toBe(previous[1]);
    expect(reordered[1]).toBe(previous[0]);
  });
});
