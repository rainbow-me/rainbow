import { type ImageRequireSource } from 'react-native';

import AtpIcon from '@/features/sports/assets/atp.png';
import BaseballIcon from '@/features/sports/assets/baseball.png';
import BasketballIcon from '@/features/sports/assets/basketball.png';
import CallOfDutyIcon from '@/features/sports/assets/codmw.png';
import Cs2Icon from '@/features/sports/assets/cs2.png';
import Dota2Icon from '@/features/sports/assets/dota2.png';
import EsportsIcon from '@/features/sports/assets/esports.png';
import FootballIcon from '@/features/sports/assets/football.png';
import HockeyIcon from '@/features/sports/assets/hockey.png';
import LeagueOfLegendsIcon from '@/features/sports/assets/lol.png';
import MlbIcon from '@/features/sports/assets/mlb.png';
import MobileLegendsIcon from '@/features/sports/assets/mlbb.png';
import MlsIcon from '@/features/sports/assets/mls.png';
import NbaIcon from '@/features/sports/assets/nba.png';
import NflIcon from '@/features/sports/assets/nfl.png';
import NhlIcon from '@/features/sports/assets/nhl.png';
import SoccerIcon from '@/features/sports/assets/soccer.png';
import TennisIcon from '@/features/sports/assets/tennis.png';
import UfcIcon from '@/features/sports/assets/ufc.png';
import ValorantIcon from '@/features/sports/assets/val.png';
import WnbaIcon from '@/features/sports/assets/wnba.png';
import WtaIcon from '@/features/sports/assets/wta.png';

type SportsIcon = { source: ImageRequireSource; color: string; darken: number };

/**
 * Bundled badge artwork and colors keyed by sport or competition ID.
 */
export const sportsIcons: Partial<Record<string, SportsIcon>> = {
  atp: { source: AtpIcon, color: '#3A38D7', darken: 0.4 },
  baseball: { source: BaseballIcon, color: '#59A3F9', darken: 0.3 },
  basketball: { source: BasketballIcon, color: '#FF6A37', darken: 0.3 },
  codmw: { source: CallOfDutyIcon, color: '#434343', darken: 0.4 },
  cs2: { source: Cs2Icon, color: '#D8A73A', darken: 0.4 },
  dota2: { source: Dota2Icon, color: '#F44336', darken: 0.4 },
  esports: { source: EsportsIcon, color: '#F64437', darken: 0.3 },
  football: { source: FootballIcon, color: '#BB523A', darken: 0.3 },
  hockey: { source: HockeyIcon, color: '#9ADDFA', darken: 0.3 },
  lol: { source: LeagueOfLegendsIcon, color: '#0BC8E3', darken: 0.4 },
  mlb: { source: MlbIcon, color: '#004685', darken: 0.3 },
  mlbb: { source: MobileLegendsIcon, color: '#FF4E00', darken: 0.4 },
  mls: { source: MlsIcon, color: '#E2231A', darken: 0.3 },
  nba: { source: NbaIcon, color: '#0B5CBD', darken: 0.3 },
  nfl: { source: NflIcon, color: '#004590', darken: 0.4 },
  nhl: { source: NhlIcon, color: '#9BA2A6', darken: 0.4 },
  soccer: { source: SoccerIcon, color: '#1CB967', darken: 0.3 },
  tennis: { source: TennisIcon, color: '#D6FE51', darken: 0.3 },
  ufc: { source: UfcIcon, color: '#D20A0A', darken: 0.2 },
  val: { source: ValorantIcon, color: '#FF4655', darken: 0.4 },
  wnba: { source: WnbaIcon, color: '#FF4713', darken: 0.3 },
  wta: { source: WtaIcon, color: '#7814FF', darken: 0.4 },
};
