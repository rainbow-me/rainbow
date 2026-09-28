import { type SportsDestination } from './browse';
import { Sport_Browse, type SportsCatalog as CatalogMessage, type Competition } from './generated/sports';

/**
 * A catalog sport or competition indexed for browsing. Competitions have a parent sport.
 * `directoryIds` is present for sports browsed by competition;
 * its absence means the scope is browsed as games.
 */
export type SportsScope = Competition & {
  parentId?: string;
  directoryIds?: string[];
  searchName: string;
  /** The category tab for this scope when opened directly or from Search. */
  category: SportsDestination;
  /** The earliest curated Live group containing this competition; absent when the competition groups itself. */
  liveGroup?: { id: string; rank: number };
};

/**
 * One service revision's browse policy and indexes. Scope IDs identify both sports and competitions.
 * Arrays preserve catalog order; `scopeIds` lists sports before competitions, and `liveGroupOrder`
 * places curated groups before the remaining competitions.
 */
export type SportsCatalog = {
  revision: number;
  scopes: Partial<Record<string, SportsScope>>;
  sportIds: string[];
  scopeIds: string[];
  categories: SportsDestination[];
  liveGroupOrder: string[];
};

/**
 * Builds the browse indexes for a service catalog and its response revision.
 * A competition belonging to several curated Live groups uses the earliest group in the policy.
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
    categories: ['live', ...catalog.prominentScopeIds, 'all'],
    liveGroupOrder: [...new Set([...catalog.liveGroupIds, ...competitionIds])],
  };
}
