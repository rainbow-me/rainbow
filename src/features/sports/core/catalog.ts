import { type SportsDestination } from './browse';
import { Sport_Browse, type SportsCatalog as CatalogResponse, type Competition } from './generated/sports';

export type SportsScope = Competition & {
  parentId?: string;
  directoryIds?: string[];
  searchName: string;
  category: SportsDestination;
  liveGroup?: { id: string; rank: number };
};

export type SportsCatalog = {
  revision: number;
  scopes: Partial<Record<string, SportsScope>>;
  sportIds: string[];
  scopeIds: string[];
  categories: SportsDestination[];
  promotedRanks: Partial<Record<string, number>>;
  liveGroupOrder: string[];
};

/**
 * Indexes a catalog response for browsing: scopes by ID with their parents, directories, and categories, the
 * category tabs, promoted games' ranks, and the order of Live groups.
 */
export function buildSportsCatalog(catalog: CatalogResponse): SportsCatalog {
  const scopes: SportsCatalog['scopes'] = {};
  const sportIds: string[] = [];
  const competitionIds: string[] = [];
  const competitionsBySport: Record<string, string[]> = {};
  const prominent = new Set(catalog.prominentScopeIds);

  for (const sport of catalog.sports) {
    const children = sport.competitions.map(competition => competition.id);
    const category = prominent.has(sport.id) ? sport.id : 'all';
    sportIds.push(sport.id);
    competitionsBySport[sport.id] = children;
    scopes[sport.id] = {
      id: sport.id,
      name: sport.name,
      imageUrl: sport.imageUrl,
      color: sport.color,
      directoryIds: sport.browse === Sport_Browse.BROWSE_COMPETITIONS ? children : undefined,
      searchName: sport.name.toLocaleLowerCase(),
      category,
    };

    for (const competition of sport.competitions) {
      competitionIds.push(competition.id);
      scopes[competition.id] = {
        ...competition,
        parentId: sport.id,
        searchName: competition.name.toLocaleLowerCase(),
        category: prominent.has(competition.id) ? competition.id : category,
      };
    }
  }

  for (const [rank, id] of catalog.liveGroupIds.entries()) {
    const group = { id, rank };
    for (const competitionId of competitionsBySport[id] ?? [id]) {
      const competition = scopes[competitionId];
      if (competition && !competition.liveGroup) competition.liveGroup = group;
    }
  }

  return {
    revision: catalog.revision,
    scopes,
    sportIds,
    scopeIds: [...sportIds, ...competitionIds],
    categories: ['live', ...catalog.prominentScopeIds.filter(id => scopes[id]), 'all'],
    promotedRanks: Object.fromEntries(catalog.promotedGameIds.map((id, rank) => [id, rank])),
    liveGroupOrder: [...new Set([...catalog.liveGroupIds, ...competitionIds])],
  };
}
