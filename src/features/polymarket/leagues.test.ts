import { getGammaLeagueId, getLeagueId } from './leagues';

describe('Polymarket league ids', () => {
  describe('getLeagueId', () => {
    it.each([
      ['nba-lal-bos-2026-01-01', 'nba'],
      ['mlb-bos-nyy-2026-06-06', 'mlb'],
      ['epl-ars-che-2026-06-11', 'epl'],
      ['atp-zhou-kotov-2026-04-12', 'atp'],
      ['dota2-tundra-lgd-2026-05-29', 'dota2'],
    ])('parses %s as %s', (slug, leagueId) => {
      expect(getLeagueId(slug)).toBe(leagueId);
    });

    it('places World Cup events under fifa', () => {
      expect(getLeagueId('fifwc-kr-cze-2026-06-11')).toBe('fifa');
    });
  });

  describe('getGammaLeagueId', () => {
    it.each([
      ['fifwc-kr-cze-2026-06-11', 'fifwc'],
      ['nba-lal-bos-2026-01-01', 'nba'],
      ['mlb-bos-nyy-2026-06-06', 'mlb'],
      ['epl-ars-che-2026-06-11', 'epl'],
      ['atp-zhou-kotov-2026-04-12', 'atp'],
      ['dota2-tundra-lgd-2026-05-29', 'dota2'],
    ])('uses the event slug prefix for team metadata: %s', (slug, leagueId) => {
      expect(getGammaLeagueId(slug)).toBe(leagueId);
    });

    it.each([
      ['ufc-jon-jones-next-fight', 'mma'],
      ['cs2-arc-red-venom-map-2', 'csgo'],
      ['val-sen-g2-2026-06-11', 'valorant'],
      ['lol-t1-geng-2026-06-11', 'league-of-legends'],
      ['sc2-maru-serral-2026-06-11', 'starcraft2'],
    ])('uses configured team metadata league for %s', (slug, leagueId) => {
      expect(getGammaLeagueId(slug)).toBe(leagueId);
    });

    it('passes through unknown event slug prefixes', () => {
      expect(getGammaLeagueId('newleague-team-a-team-b')).toBe('newleague');
    });
  });
});
