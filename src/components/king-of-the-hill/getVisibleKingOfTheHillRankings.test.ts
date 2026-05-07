import { getVisibleKingOfTheHillRankings } from '@/components/king-of-the-hill/getVisibleKingOfTheHillRankings';

describe('getVisibleKingOfTheHillRankings', () => {
  it('excludes the header rank and ranks beyond the visible top 10', () => {
    const rankings = Array.from({ length: 12 }, (_, index) => ({ rank: index + 1 }));

    expect(getVisibleKingOfTheHillRankings(rankings).map(({ rank }) => rank)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('preserves rank gaps from backend filtering instead of filling with lower-ranked items', () => {
    const rankings = [{ rank: 1 }, { rank: 2 }, { rank: 3 }, { rank: 7 }, { rank: 10 }, { rank: 11 }, { rank: 12 }];

    expect(getVisibleKingOfTheHillRankings(rankings).map(({ rank }) => rank)).toEqual([2, 3, 7, 10]);
  });
});
