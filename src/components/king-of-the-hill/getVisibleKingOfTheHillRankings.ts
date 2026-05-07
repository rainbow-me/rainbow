export const KING_OF_THE_HILL_MAX_VISIBLE_RANK = 10;

type RankingWithRank = {
  rank: number;
};

export function getVisibleKingOfTheHillRankings<Ranking extends RankingWithRank>(rankings: readonly Ranking[]): Ranking[] {
  return rankings.filter(({ rank }) => rank > 1 && rank <= KING_OF_THE_HILL_MAX_VISIBLE_RANK);
}
