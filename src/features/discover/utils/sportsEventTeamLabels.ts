import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';

const NON_TEAM_OUTCOME_LABELS = new Set(['draw', 'no', 'over', 'under', 'yes']);

export function getDiscoverSportsEventTeamLabels(event: PolymarketEvent, labels: [string, string]): [string, string] {
  if (labels[0] && labels[1]) return labels;
  return parseTeamNamesFromTitle(event.title) ?? getTeamNamesFromMarketOutcomes(event) ?? labels;
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
