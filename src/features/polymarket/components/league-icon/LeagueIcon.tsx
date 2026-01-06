import React, { memo, useMemo } from 'react';
import { useColorMode } from '@/design-system';
import { SPORT_LEAGUES, getLeagueId } from '@/features/polymarket/leagues';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { CfbIcon } from './icons/CfbIcon';
import { Cs2Icon } from './icons/Cs2Icon';
import { CricketIcon } from './icons/CricketIcon';
import { Dota2Icon } from './icons/Dota2Icon';
import { SoccerIcon } from './icons/SoccerIcon';
import { HockeyIcon } from './icons/HockeyIcon';
import { NbaIcon } from './icons/NbaIcon';
import { NhlIcon } from './icons/NhlIcon';
import { TennisIcon } from './icons/TennisIcon';
import { UfcIcon } from './icons/UfcIcon';
import { ValorantIcon } from './icons/ValorantIcon';
import { NflIcon } from './icons/NflIcon';
import { BaseballIcon } from './icons/BaseballIcon';

type IconComponent = React.ComponentType<{ fill?: string; width?: number; height?: number }>;

type LeagueId = keyof typeof SPORT_LEAGUES;
type SportId = (typeof SPORT_LEAGUES)[LeagueId]['sportId'];

const LEAGUE_ICONS: Partial<Record<LeagueId, IconComponent>> = {
  cfb: CfbIcon,
  cs2: Cs2Icon,
  dota2: Dota2Icon,
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
};

export function getIconByLeagueId(leagueId: LeagueId): IconComponent | undefined {
  return LEAGUE_ICONS[leagueId] ?? SPORT_ICONS[SPORT_LEAGUES[leagueId]?.sportId];
}

export function hasLeagueIcon(eventSlug: string): boolean {
  const leagueId = getLeagueId(eventSlug);
  return leagueId ? getIconByLeagueId(leagueId) !== undefined : false;
}

type LeagueIconProps =
  | {
      leagueId?: never;
      eventSlug: string;
      color?: string;
      size?: number;
    }
  | {
      leagueId: LeagueId;
      eventSlug?: never;
      color?: string;
      size?: number;
    };

export const LeagueIcon = memo(function LeagueIcon({ leagueId, eventSlug, color, size = 24 }: LeagueIconProps) {
  const { isDarkMode } = useColorMode();

  const resolvedLeagueId = leagueId ?? getLeagueId(eventSlug);
  const league = useMemo(() => (resolvedLeagueId ? SPORT_LEAGUES[resolvedLeagueId] : undefined), [resolvedLeagueId]);

  const IconComponent = useMemo(() => (resolvedLeagueId ? getIconByLeagueId(resolvedLeagueId) : undefined), [resolvedLeagueId]);
  if (!IconComponent) return null;

  const fillColor = color ?? getColorValueForThemeWorklet(league?.color, isDarkMode);

  return <IconComponent fill={fillColor} width={size} height={size} />;
});
