import {
  getGammaLeagueId,
  getLeague,
  getLeagueId,
  getLeagueSlugId,
  SPORT_LEAGUES,
  type LeagueId,
  type SportId,
} from '@/features/polymarket/leagues';

const LEAGUES_WITH_SPORT_ICON_FALLBACK = {
  bkaba: 'basketball',
  cde: 'soccer',
  egy1: 'soccer',
  ere: 'soccer',
  lib: 'soccer',
  wch: 'hockey',
  wnba: 'basketball',
} as const satisfies Partial<Record<LeagueId, SportId>>;

describe('Polymarket leagues', () => {
  it('normalizes league slugs before resolving league metadata', () => {
    expect(getLeagueSlugId('WNBA-2026-championship')).toBe('wnba');
    expect(getLeagueId('WNBA-2026-championship')).toBe('wnba');
    expect(getGammaLeagueId('WNBA-2026-championship')).toBe('wnba');
  });

  it('maps supported sports leagues to sport icon fallback families', () => {
    for (const [leagueId, sportId] of Object.entries(LEAGUES_WITH_SPORT_ICON_FALLBACK) as [LeagueId, SportId][]) {
      expect(getLeague(`${leagueId}-event-slug`)).toEqual(SPORT_LEAGUES[leagueId]);
      expect(SPORT_LEAGUES[leagueId].sportId).toBe(sportId);
      expect(getGammaLeagueId(`${leagueId}-event-slug`)).toBe(leagueId);
    }
  });
});
