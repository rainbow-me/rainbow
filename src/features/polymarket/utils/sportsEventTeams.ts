import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { PolymarketTeamInfo } from '@/features/polymarket/types';

const MAX_TEAM_NAME_LENGTH = 14;

export type TeamSide = 'away' | 'home';

export type TeamDisplayInfo = {
  labels: [string, string];
  title: string;
};

export type EventTeams = {
  away?: PolymarketTeamInfo;
  home?: PolymarketTeamInfo;
  names: [string, string];
  labels: [string, string];
  title: string;
};

export function getEventTeams(event: PolymarketEvent): EventTeams {
  const awayTeam = event.teams?.[0];
  const homeTeam = event.teams?.[1];

  const awayName = awayTeam?.name ?? event.awayTeamName ?? '';
  const homeName = homeTeam?.name ?? event.homeTeamName ?? '';
  const names: [string, string] = [awayName, homeName];

  let labels: [string, string] = names;
  if (
    (awayName.length > MAX_TEAM_NAME_LENGTH || homeName.length > MAX_TEAM_NAME_LENGTH) &&
    awayTeam?.abbreviation &&
    homeTeam?.abbreviation
  ) {
    labels = [awayTeam.abbreviation.toUpperCase(), homeTeam.abbreviation.toUpperCase()];
  }

  const title = awayName && homeName ? `${awayName} vs. ${homeName}` : event.title;

  return { away: awayTeam, home: homeTeam, names, labels, title };
}

export function getTeamDisplayInfo(event: PolymarketEvent): TeamDisplayInfo {
  const { labels, title } = getEventTeams(event);
  return { labels, title };
}
