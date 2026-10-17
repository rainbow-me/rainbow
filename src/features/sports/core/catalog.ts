import { type SportsDestination } from './browse';
import { Sport_Browse, type SportsCatalog as CatalogMessage, type Competition } from './generated/sports';

/**
 * A sport or competition in the browse catalog.
 */
export type SportsScope = Competition & {
  parentId?: string;
  /** Child competitions for sports displayed as a directory. */
  directoryIds?: string[];
  searchName: string;
  /** The category tab containing this scope. */
  category: SportsDestination;
  /** The first curated Live group containing this competition. */
  liveGroup?: { id: string; rank: number };
};

/**
 * The Sports catalog indexed for navigation and game grouping.
 */
export type SportsCatalog = {
  revision: number;
  scopes: Partial<Record<string, SportsScope>>;
  sportIds: string[];
  /** Sport IDs followed by competition IDs. */
  scopeIds: string[];
  prominentCategories: { key: SportsDestination; label: string }[];
  /** Curated Live groups followed by the remaining competitions. */
  liveGroupOrder: string[];
};

/**
 * Indexes the service catalog for navigation and game grouping.
 */
export function buildSportsCatalog(catalog: CatalogMessage, revision: number): SportsCatalog {
  const scopes: SportsCatalog['scopes'] = {};
  const sportIds: string[] = [];
  const competitionIds: string[] = [];
  const competitionIdsBySport: Record<string, string[]> = {};
  const prominentScopeIds = new Set(catalog.prominentScopeIds);

  for (const sport of catalog.sports) {
    const childIds = sport.competitions.map(competition => competition.id);
    const category = prominentScopeIds.has(sport.id) ? sport.id : 'all';
    sportIds.push(sport.id);
    competitionIdsBySport[sport.id] = childIds;
    scopes[sport.id] = {
      id: sport.id,
      name: sport.name,
      imageUrl: sport.imageUrl,
      color: sport.color,
      directoryIds: sport.browse === Sport_Browse.BROWSE_COMPETITIONS ? childIds : undefined,
      searchName: sport.name.toLocaleLowerCase(),
      category,
    };

    for (const competition of sport.competitions) {
      competitionIds.push(competition.id);
      scopes[competition.id] = {
        ...competition,
        parentId: sport.id,
        searchName: competition.name.toLocaleLowerCase(),
        category: prominentScopeIds.has(competition.id) ? competition.id : category,
      };
    }
  }

  for (const [rank, id] of catalog.liveGroupIds.entries()) {
    const group = { id, rank };
    for (const competitionId of competitionIdsBySport[id] ?? [id]) {
      const competition = scopes[competitionId];
      if (competition && !competition.liveGroup) competition.liveGroup = group;
    }
  }

  return {
    revision,
    scopes,
    sportIds,
    scopeIds: [...sportIds, ...competitionIds],
    prominentCategories: catalog.prominentScopeIds.map(key => ({ key, label: scopes[key]?.name ?? '' })),
    liveGroupOrder: [...new Set([...catalog.liveGroupIds, ...competitionIds])],
  };
}
