import { getIconByLeagueId } from '@/features/polymarket/components/league-icon/LeagueIcon';
import {
  getGammaLeagueId,
  getLeague,
  getLeagueId,
  getLeagueSlugId,
  SPORT_LEAGUES,
  type LeagueId,
  type SportId,
} from '@/features/polymarket/leagues';

jest.mock('@/__swaps__/utils/swaps', () => ({
  getColorValueForThemeWorklet: jest.fn(),
}));
jest.mock('@/design-system', () => ({
  useColorMode: () => ({ isDarkMode: true }),
}));

const LEAGUES_WITH_SPORT_ICON_FALLBACK = {
  ahl: 'hockey',
  bkaba: 'basketball',
  bkseriea: 'basketball',
  bra1: 'soccer',
  bra2: 'soccer',
  bsseriea: 'soccer',
  cde: 'soccer',
  cze1: 'soccer',
  dfb: 'soccer',
  egy1: 'soccer',
  ere: 'soccer',
  f1: 'motorsports',
  fif: 'soccer',
  fifwc: 'soccer',
  fl1: 'soccer',
  itf: 'tennis',
  j2100: 'soccer',
  lib: 'soccer',
  mex: 'soccer',
  nor: 'soccer',
  sud: 'soccer',
  tur: 'soccer',
  wch: 'hockey',
  wnba: 'basketball',
} as const satisfies Partial<Record<LeagueId, SportId>>;

const CURRENT_POLYMARKET_SPORTS_CODES = [
  'ahl',
  'atp',
  'bkseriea',
  'bra1',
  'bra2',
  'cde',
  'cs2',
  'cze1',
  'dfb',
  'dota2',
  'epl',
  'f1',
  'fif',
  'fifwc',
  'fl1',
  'itf',
  'j2100',
  'lal',
  'lib',
  'lol',
  'mex',
  'mlb',
  'mls',
  'nba',
  'nhl',
  'nor',
  'sea',
  'sud',
  'tur',
  'ucl',
  'wch',
  'wnba',
  'wta',
] as const satisfies readonly LeagueId[];

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

  it('has icon coverage for current Polymarket sports slugs', () => {
    for (const leagueId of CURRENT_POLYMARKET_SPORTS_CODES) {
      expect(getLeagueId(`${leagueId}-event-slug`)).toBe(leagueId);
      expect(getIconByLeagueId(leagueId)).toBeDefined();
    }
  });
});
