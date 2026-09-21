import { type ImageRequireSource } from 'react-native';

type SportsIcon = { source: ImageRequireSource; color: string; darken: number; scale: number; offset?: readonly [number, number] };

/** Standard category artwork exported from the Sports design; other competitions use their catalog image. */
export const sportsIcons: Partial<Record<string, SportsIcon>> = {
  'atp': { source: require('../assets/atp.png'), color: '#3A38D7', darken: 0.4, scale: 0.67271 },
  'baseball': { source: require('../assets/baseball.png'), color: '#1372CA', darken: 0.3, scale: 0.55161 },
  'basketball': { source: require('../assets/basketball.png'), color: '#FF6A37', darken: 0.3, scale: 0.5 },
  'cs2': { source: require('../assets/cs2.png'), color: '#D8A73A', darken: 0.4, scale: 0.71429 },
  'dota2': { source: require('../assets/dota2.png'), color: '#F44336', darken: 0.4, scale: 0.50893 },
  'esports': { source: require('../assets/esports.png'), color: '#63BFF7', darken: 0.3, scale: 0.60616 },
  'football': { source: require('../assets/football.png'), color: '#2D6B9A', darken: 0.3, scale: 0.53646 },
  'hockey': { source: require('../assets/hockey.png'), color: '#2F9C5E', darken: 0.3, scale: 0.52417 },
  'lol': { source: require('../assets/lol.png'), color: '#0BC8E3', darken: 0.4, scale: 0.57143 },
  'mlb': { source: require('../assets/mlb.png'), color: '#004685', darken: 0.3, scale: 0.64286 },
  'nba': { source: require('../assets/nba.png'), color: '#0B5CBD', darken: 0.3, scale: 0.71429 },
  'nfl': { source: require('../assets/nfl.png'), color: '#114073', darken: 0.4, scale: 0.60684 },
  'nhl': { source: require('../assets/nhl.png'), color: '#9BA2A6', darken: 0.4, scale: 0.64286 },
  'soccer': { source: require('../assets/soccer.png'), color: '#1CB967', darken: 0.3, scale: 0.49889 },
  'tennis': { source: require('../assets/tennis.png'), color: '#D6FE51', darken: 0.3, scale: 0.49889 },
  'wta': { source: require('../assets/wta.png'), color: '#7814FF', darken: 0.4, scale: 0.56607 },
  'esports-header': {
    source: require('../assets/esports-header.png'),
    color: '#F64437',
    darken: 0.3,
    scale: 0.82379,
    offset: [0.32983, 2.33472],
  },
  'nba-header': { source: require('../assets/nba-header.png'), color: '#0B5CBD', darken: 0.3, scale: 0.72727, offset: [0.5, 0.0] },
  'nfl-header': { source: require('../assets/nfl-header.png'), color: '#114073', darken: 0.4, scale: 0.59061, offset: [-0.04102, 0.0065] },
};
