import { getSportsWindow } from './browse';
import { buildSportsCatalog } from './catalog';
import { Game_Interruption, Game_Status, Sport_Browse, type Game, type SportsCatalog } from './generated/sports';
import { groupSportsGames } from './sections';

const window = getSportsWindow(new Date(2026, 8, 20, 12));
const catalogMessage: SportsCatalog = {
  sports: [
    {
      id: 'tennis',
      name: 'Tennis',
      browse: Sport_Browse.BROWSE_GAMES,
      competitions: [
        { id: 'atp', name: 'ATP' },
        { id: 'us-open', name: 'US Open' },
        { id: 'wta', name: 'WTA' },
      ],
    },
    { id: 'basketball', name: 'Basketball', browse: Sport_Browse.BROWSE_GAMES, competitions: [{ id: 'nba', name: 'NBA' }] },
    { id: 'soccer', name: 'Soccer', browse: Sport_Browse.BROWSE_COMPETITIONS, competitions: [{ id: 'epl', name: 'Premier League' }] },
  ],
  liveGroupIds: ['tennis', 'us-open'],
  prominentScopeIds: [],
  promotedGameIds: [],
};
const catalog = buildSportsCatalog(catalogMessage, 1);

function game(id: string, fields: Partial<Game> = {}): Game {
  return {
    id,
    competitionIds: ['atp'],
    startsAt: new Date(2026, 8, 20, 15).toISOString(),
    status: Game_Status.STATUS_LIVE,
    interruption: Game_Interruption.INTERRUPTION_UNSPECIFIED,
    participants: [],
    score: [],
    ...fields,
  };
}

function sectionInputs(...games: Game[]): [Partial<Record<string, Game>>, string[]] {
  return [Object.fromEntries(games.map(game => [game.id, game])), games.map(game => game.id)];
}

describe('Sports sections', () => {
  it('groups an ordered response without changing its order within each section', () => {
    const games = [
      game('server-first', { startsAt: new Date(2026, 8, 20, 18).toISOString() }),
      game('today', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 20, 14).toISOString() }),
      game('live'),
      game('tomorrow', { status: Game_Status.STATUS_SCHEDULED, startsAt: new Date(2026, 8, 21).toISOString() }),
    ];
    const selection = groupSportsGames(catalog, ...sectionInputs(...games), { scopeId: 'tennis', window });

    expect(selection).toEqual([
      { type: 'live', gameIds: ['server-first', 'live'] },
      { type: 'today', gameIds: ['today'] },
      { type: 'upcoming', gameIds: ['tomorrow'] },
    ]);
  });

  it('groups live games under the first matching Live group', () => {
    const inputs = sectionInputs(
      game('basketball-match', { competitionIds: ['nba'] }),
      game('tennis-match', { competitionIds: ['us-open', 'atp'] }),
      game('scheduled', { status: Game_Status.STATUS_SCHEDULED })
    );

    expect(groupSportsGames(catalog, ...inputs)).toEqual([
      { type: 'live', scopeId: 'tennis', gameIds: ['tennis-match'] },
      { type: 'live', scopeId: 'nba', gameIds: ['basketball-match'] },
    ]);
  });

  it('shows only Games belonging to catalogued Live groups', () => {
    const known = game('known');
    const unknown = game('unknown', { competitionIds: ['unlisted'] });
    const selected = groupSportsGames(catalog, ...sectionInputs(known, unknown));

    expect(selected).toEqual([{ type: 'live', scopeId: 'tennis', gameIds: ['known'] }]);
    expect(groupSportsGames(undefined, ...sectionInputs(known))).toEqual([]);
  });

  it('uses the preferred competition for uncurated Live games, ordered by the catalog', () => {
    const inputs = sectionInputs(
      game('wta-match', { competitionIds: ['wta', 'atp'] }),
      game('atp-match'),
      game('tournament-match', { competitionIds: ['us-open', 'atp'] })
    );

    expect(groupSportsGames(buildSportsCatalog({ ...catalogMessage, liveGroupIds: ['us-open'] }, 1), ...inputs)).toEqual([
      { type: 'live', scopeId: 'us-open', gameIds: ['tournament-match'] },
      { type: 'live', scopeId: 'atp', gameIds: ['atp-match'] },
      { type: 'live', scopeId: 'wta', gameIds: ['wta-match'] },
    ]);
  });

  it('chooses the first curated Live group even when its competition is not first on the game', () => {
    const inputs = sectionInputs(game('match', { competitionIds: ['atp', 'us-open'] }));

    expect(groupSportsGames(buildSportsCatalog({ ...catalogMessage, liveGroupIds: ['us-open', 'tennis'] }, 1), ...inputs)).toEqual([
      { type: 'live', scopeId: 'us-open', gameIds: ['match'] },
    ]);
  });

  it('caps each section at thirty', () => {
    const inputs = sectionInputs(
      ...Array.from({ length: 31 }, (_, index) => [
        game(`live-${String(index).padStart(2, '0')}`),
        game(`today-${String(index).padStart(2, '0')}`, { status: Game_Status.STATUS_SCHEDULED }),
      ]).flat()
    );
    const sections = groupSportsGames(catalog, ...inputs, { scopeId: 'tennis', window });

    expect(sections.map(section => [section.type, section.gameIds.length])).toEqual([
      ['live', 30],
      ['today', 30],
    ]);
    expect(sections.flatMap(section => section.gameIds)).not.toContain('live-30');
  });

  it('shows the games of a scope and of its competitions', () => {
    const inputs = sectionInputs(
      game('atp-match'),
      game('wta-match', { competitionIds: ['wta'] }),
      game('nba-match', { competitionIds: ['nba'] })
    );

    expect(groupSportsGames(catalog, ...inputs, { scopeId: 'tennis', window })).toEqual([
      { type: 'live', gameIds: ['atp-match', 'wta-match'] },
    ]);
    expect(groupSportsGames(catalog, ...inputs, { scopeId: 'wta', window })).toEqual([{ type: 'live', gameIds: ['wta-match'] }]);
  });

  it('shows only live games for a sport browsed by competition', () => {
    const inputs = sectionInputs(
      game('live', { competitionIds: ['epl'] }),
      game('scheduled', { competitionIds: ['epl'], status: Game_Status.STATUS_SCHEDULED })
    );

    expect(groupSportsGames(catalog, ...inputs, { scopeId: 'soccer', window })).toEqual([{ type: 'live', gameIds: ['live'] }]);
    expect(groupSportsGames(catalog, ...inputs, { scopeId: 'epl', window })).toEqual([
      { type: 'live', gameIds: ['live'] },
      { type: 'today', gameIds: ['scheduled'] },
    ]);
  });

  it('uses local calendar boundaries without inferring Live from a past kickoff', () => {
    const scheduled = (id: string, date: Date): Game => game(id, { status: Game_Status.STATUS_SCHEDULED, startsAt: date.toISOString() });
    const inputs = sectionInputs(
      scheduled('before-today', new Date(2026, 8, 19, 23, 59, 59, 999)),
      scheduled('past-kickoff', new Date(2026, 8, 20)),
      scheduled('tonight', new Date(2026, 8, 20, 23, 59, 59, 999)),
      scheduled('tomorrow', new Date(2026, 8, 21)),
      scheduled('last-day', new Date(2026, 8, 26, 23, 59, 59, 999)),
      scheduled('outside-window', new Date(2026, 8, 27)),
      game('missing-start', { status: Game_Status.STATUS_SCHEDULED, startsAt: undefined }),
      game('overnight-live', { startsAt: new Date(2026, 8, 19, 23).toISOString() }),
      game('finished', { status: Game_Status.STATUS_ENDED }),
      game('unknown', { status: Game_Status.STATUS_UNSPECIFIED })
    );

    expect(groupSportsGames(catalog, ...inputs, { scopeId: 'tennis', window })).toEqual([
      { type: 'live', gameIds: ['overnight-live'] },
      { type: 'today', gameIds: ['past-kickoff', 'tonight'] },
      { type: 'upcoming', gameIds: ['tomorrow', 'last-day'] },
    ]);
  });
});
