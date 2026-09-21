import { getSportsNavigationRoot, getSportsParentDestination, hasCompetitionDirectory, scopeContainsGame } from './browse';
import { buildSportsCatalog } from './catalog';
import { Sport_Browse, SportsCatalog } from './generated/sports';

const catalog = buildSportsCatalog(
  SportsCatalog.fromJSON({
    revision: 7,
    sports: [
      {
        id: 'soccer',
        name: 'Soccer',
        browse: Sport_Browse.BROWSE_COMPETITIONS,
        competitions: [{ id: 'epl', name: 'Premier League' }],
      },
      {
        id: 'tennis',
        name: 'Tennis',
        browse: Sport_Browse.BROWSE_GAMES,
        competitions: [
          { id: 'atp', name: 'ATP Tour' },
          { id: 'wta', name: 'WTA Tour' },
        ],
      },
    ],
    prominentScopeIds: ['soccer', 'atp'],
    liveGroupIds: ['atp', 'tennis'],
    promotedGameIds: ['second', 'first'],
  })
);

describe('Sports catalog', () => {
  it('shares directory, search, category, and parent relationships from one catalog', () => {
    const epl = { type: 'scope', scopeId: 'epl' } as const;
    const soccer = { type: 'scope', scopeId: 'soccer' } as const;
    const atp = { type: 'scope', scopeId: 'atp' } as const;

    expect(catalog.revision).toBe(7);
    expect(catalog.sportIds).toEqual(['soccer', 'tennis']);
    expect(catalog.scopeIds).toEqual(['soccer', 'tennis', 'epl', 'atp', 'wta']);
    expect(catalog.categories).toEqual([{ type: 'live' }, soccer, atp, { type: 'all' }]);
    expect(catalog.scopes.soccer?.directoryIds).toEqual(['epl']);
    expect(catalog.scopes.epl?.parentId).toBe('soccer');
    expect(catalog.scopes.epl?.searchName).toBe('premier league');
    expect(hasCompetitionDirectory(catalog, 'soccer')).toBe(true);
    expect(hasCompetitionDirectory(catalog, 'tennis')).toBe(false);
    expect(getSportsNavigationRoot(catalog, epl)).toEqual(soccer);
    expect(getSportsParentDestination(catalog, epl, soccer)).toEqual(soccer);
    expect(getSportsNavigationRoot(catalog, atp)).toEqual(atp);
    expect(scopeContainsGame(catalog, 'soccer', ['epl'])).toBe(true);
    expect(scopeContainsGame(catalog, 'tennis', ['epl'])).toBe(false);
  });

  it('resolves overlapping Live groups in editorial order without changing fallback competition order', () => {
    expect(catalog.scopes.atp?.liveGroup).toEqual({ id: 'atp', rank: 0 });
    expect(catalog.scopes.wta?.liveGroup).toEqual({ id: 'tennis', rank: 1 });
    expect(catalog.scopes.epl?.liveGroup).toBeUndefined();
    expect(catalog.liveGroupOrder).toEqual(['atp', 'tennis', 'epl', 'wta']);
    expect(catalog.promotedRanks).toEqual({ second: 0, first: 1 });
  });
});
