import { type SportsDestination } from './browse';
import { Sport_Browse, type SportsCatalog as CatalogResponse, type Competition } from './generated/sports';

export type SportsScope = Competition & {
  parentId?: string;
  directoryIds?: string[];
  searchName: string;
  navigationRoot: SportsDestination;
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

export function buildSportsCatalog(catalog: CatalogResponse): SportsCatalog {
  const scopes: SportsCatalog['scopes'] = {};
  const sportIds: string[] = [];
  const competitionIds: string[] = [];
  const competitionsBySport: Record<string, string[]> = {};
  const prominent = new Set(catalog.prominentScopeIds);

  for (const sport of catalog.sports) {
    const children = sport.competitions.map(competition => competition.id);
    const navigationRoot: SportsDestination = prominent.has(sport.id) ? { type: 'scope', scopeId: sport.id } : { type: 'all' };
    sportIds.push(sport.id);
    competitionsBySport[sport.id] = children;
    scopes[sport.id] = {
      id: sport.id,
      name: sport.name,
      imageUrl: sport.imageUrl,
      color: sport.color,
      directoryIds: sport.browse === Sport_Browse.BROWSE_COMPETITIONS ? children : undefined,
      searchName: sport.name.toLocaleLowerCase(),
      navigationRoot,
    };
    for (const competition of sport.competitions) {
      competitionIds.push(competition.id);
      scopes[competition.id] = {
        ...competition,
        parentId: sport.id,
        searchName: competition.name.toLocaleLowerCase(),
        navigationRoot: prominent.has(competition.id) ? { type: 'scope', scopeId: competition.id } : navigationRoot,
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

  const categories: SportsDestination[] = [{ type: 'live' }];
  for (const scopeId of catalog.prominentScopeIds) {
    if (scopes[scopeId]) categories.push({ type: 'scope', scopeId });
  }
  categories.push({ type: 'all' });

  return {
    revision: catalog.revision,
    scopes,
    sportIds,
    scopeIds: [...sportIds, ...competitionIds],
    categories,
    promotedRanks: Object.fromEntries(catalog.promotedGameIds.map((id, rank) => [id, rank])),
    liveGroupOrder: [...new Set([...catalog.liveGroupIds, ...competitionIds])],
  };
}
