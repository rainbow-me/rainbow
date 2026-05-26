import { type PolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import * as i18n from '@/languages';

const MAX_TEAM_NAME_LENGTH = 14;
const NON_TEAM_OUTCOME_LABELS = new Set(['draw', 'no', 'over', 'under', 'yes']);

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
  const fallbackNames = getFallbackTeamNames(event);

  const awayName = awayTeam?.name ?? event.awayTeamName ?? fallbackNames?.[0] ?? '';
  const homeName = homeTeam?.name ?? event.homeTeamName ?? fallbackNames?.[1] ?? '';
  const names: [string, string] = [awayName, homeName];

  let labels: [string, string] = names;
  if (
    (awayName.length > MAX_TEAM_NAME_LENGTH || homeName.length > MAX_TEAM_NAME_LENGTH) &&
    awayTeam?.abbreviation &&
    homeTeam?.abbreviation
  ) {
    labels = [awayTeam.abbreviation.toUpperCase(), homeTeam.abbreviation.toUpperCase()];
  }

  const title = awayName && homeName ? `${awayName} ${i18n.t(i18n.l.predictions.sports.vs)}. ${homeName}` : event.title;

  return { away: awayTeam, home: homeTeam, names, labels, title };
}

export function getTeamDisplayInfo(event: PolymarketEvent): TeamDisplayInfo {
  const { labels, title } = getEventTeams(event);
  return { labels, title };
}

function getFallbackTeamNames(event: PolymarketEvent): [string, string] | undefined {
  return parseTeamNamesFromTitle(event.title) ?? getTeamNamesFromMarketOutcomes(event);
}

function parseTeamNamesFromTitle(title: string): [string, string] | undefined {
  const match = title.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (!match) return undefined;

  const awayName = cleanTitleTeamName(match[1]);
  const homeName = cleanTitleTeamName(match[2]);
  return awayName && homeName ? [awayName, homeName] : undefined;
}

function cleanTitleTeamName(value: string): string {
  const withoutPrefix = value.includes(':') ? value.slice(value.lastIndexOf(':') + 1) : value;
  return withoutPrefix
    .replace(/\s+\(.+$/, '')
    .replace(/\s+-\s+.+$/, '')
    .trim();
}

function getTeamNamesFromMarketOutcomes(event: PolymarketEvent): [string, string] | undefined {
  for (const market of event.markets) {
    const [awayName, homeName] = market.outcomes;
    if (isTeamOutcomeLabel(awayName) && isTeamOutcomeLabel(homeName)) {
      return [awayName, homeName];
    }
  }
}

function isTeamOutcomeLabel(value: string | undefined): value is string {
  if (!value) return false;
  return !NON_TEAM_OUTCOME_LABELS.has(value.trim().toLowerCase());
}
