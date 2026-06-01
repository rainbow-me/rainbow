import React, { memo, useMemo } from 'react';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { useColorMode } from '@/design-system';
import { getLeagueId, SPORT_LEAGUES } from '@/features/polymarket/leagues';

import { BaseballIcon } from './icons/BaseballIcon';
import { CfbIcon } from './icons/CfbIcon';
import { ChessIcon } from './icons/ChessIcon';
import { CricketIcon } from './icons/CricketIcon';
import { Cs2Icon } from './icons/Cs2Icon';
import { Dota2Icon } from './icons/Dota2Icon';
import { EsportsIcon } from './icons/EsportsIcon';
import { F1Icon } from './icons/F1Icon';
import { HockeyIcon } from './icons/HockeyIcon';
import { LacrosseIcon } from './icons/LacrosseIcon';
import { LolIcon } from './icons/LolIcon';
import { NbaIcon } from './icons/NbaIcon';
import { NflIcon } from './icons/NflIcon';
import { NhlIcon } from './icons/NhlIcon';
import { PickleballIcon } from './icons/PickleballIcon';
import { RugbyIcon } from './icons/RugbyIcon';
import { SlapIcon } from './icons/SlapIcon';
import { SoccerIcon } from './icons/SoccerIcon';
import { TennisIcon } from './icons/TennisIcon';
import { UfcIcon } from './icons/UfcIcon';
import { ValorantIcon } from './icons/ValorantIcon';

export type IconProps = { color: string; width?: number; height?: number };
type IconComponent = React.ComponentType<IconProps>;
type LeagueId = keyof typeof SPORT_LEAGUES;
type SportId = (typeof SPORT_LEAGUES)[LeagueId]['sportId'];

const LEAGUE_ICONS: Partial<Record<LeagueId, IconComponent>> = {
  cfb: CfbIcon,
  cs2: Cs2Icon,
  dota2: Dota2Icon,
  f1: F1Icon,
  lol: LolIcon,
  nba: NbaIcon,
  nhl: NhlIcon,
  ufc: UfcIcon,
  val: ValorantIcon,
  nfl: NflIcon,
};

const SPORT_ICONS: Partial<Record<SportId, IconComponent>> = {
  cricket: CricketIcon,
  soccer: SoccerIcon,
  hockey: HockeyIcon,
  tennis: TennisIcon,
  baseball: BaseballIcon,
  basketball: NbaIcon,
  esports: EsportsIcon,
  chess: ChessIcon,
  slap: SlapIcon,
  rugby: RugbyIcon,
  pickleball: PickleballIcon,
  lacrosse: LacrosseIcon,
  motorsports: F1Icon,
};

export function getIconByLeagueId(leagueId: LeagueId): IconComponent | undefined {
  return LEAGUE_ICONS[leagueId] ?? SPORT_ICONS[SPORT_LEAGUES[leagueId]?.sportId];
}

export function hasLeagueIcon(eventSlug: string): boolean {
  const leagueId = getLeagueId(eventSlug);
  return leagueId ? getIconByLeagueId(leagueId) !== undefined : false;
}

type LeagueIconProps = {
  color?: string;
  size?: number;
} & ({ leagueId: LeagueId; eventSlug?: never } | { leagueId?: never; eventSlug: string });

export const LeagueIcon = memo(function LeagueIcon({ leagueId, eventSlug, color, size = 24 }: LeagueIconProps) {
  const { isDarkMode } = useColorMode();

  const resolvedLeagueId = leagueId ?? getLeagueId(eventSlug);
  const league = useMemo(() => (resolvedLeagueId ? SPORT_LEAGUES[resolvedLeagueId] : undefined), [resolvedLeagueId]);

  const IconComponent = useMemo(() => (resolvedLeagueId ? getIconByLeagueId(resolvedLeagueId) : undefined), [resolvedLeagueId]);
  if (!IconComponent) return null;

  const resolvedColor = color ?? getColorValueForThemeWorklet(league?.color, isDarkMode);

  return <IconComponent color={resolvedColor} width={size} height={size} />;
});
