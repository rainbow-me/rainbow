import {
  getMarketsGroupedByBetType,
  type LineBasedGroup,
  type MoneylineGroup,
} from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';
import { type PolymarketTeamInfo, type TeamSide } from '@/features/polymarket/types';
import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { formatOdds } from '@/features/polymarket/utils/formatOdds';
import { isDrawMarket } from '@/features/polymarket/utils/sports';
import { getEventTeams } from '@/features/polymarket/utils/sportsEventTeams';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

export type BetCellData = {
  label: string;
  odds: string;
  outcomeTokenId: string;
};

export type TeamBetRow = Record<
  TeamSide,
  {
    spread?: BetCellData;
    moneyline?: BetCellData;
  }
>;

export type TotalsRow = {
  over?: BetCellData;
  under?: BetCellData;
};

export type EventBetGrid = {
  teamBets: TeamBetRow;
  totals: TotalsRow;
};

type MoneylineOutcome = { price: string | undefined; tokenId: string | undefined };

type TeamReference = {
  team?: PolymarketTeamInfo;
  label?: string;
};

export function buildEventBetGrid(event: PolymarketEvent): EventBetGrid {
  const grouped = getMarketsGroupedByBetType(
    event.markets.filter(market => market.active && !market.closed),
    event
  );

  const eventTeams = getEventTeams(event);
  const teamReferences: Record<TeamSide, TeamReference> = {
    away: { team: eventTeams.away, label: eventTeams.names[0] },
    home: { team: eventTeams.home, label: eventTeams.names[1] },
  };

  const spreadMarket = getPrimaryMarket(grouped.spreads[0]);
  const totalsMarket = getPrimaryMarket(grouped.totals[0]);
  const moneyline = getMoneylineData(grouped.moneyline[0], teamReferences);

  const spreadLineValue = spreadMarket?.line;
  const totalsLineValue = totalsMarket?.line;
  const spreadOutcomeIndexes = getTeamOutcomeIndexes(spreadMarket, teamReferences);
  const spreadAwayOdds = getOutcomePrice(spreadMarket, spreadOutcomeIndexes.away);
  const spreadHomeOdds = getOutcomePrice(spreadMarket, spreadOutcomeIndexes.home);
  const totalsOverOdds = getOutcomePrice(totalsMarket, 0);
  const totalsUnderOdds = getOutcomePrice(totalsMarket, 1);
  const spreadAwayTokenId = getOutcomeTokenId(spreadMarket, spreadOutcomeIndexes.away);
  const spreadHomeTokenId = getOutcomeTokenId(spreadMarket, spreadOutcomeIndexes.home);
  const totalsOverTokenId = getOutcomeTokenId(totalsMarket, 0);
  const totalsUnderTokenId = getOutcomeTokenId(totalsMarket, 1);

  const teamBets: TeamBetRow = { away: {}, home: {} };
  const totals: TotalsRow = {};

  if (spreadAwayOdds != null && spreadAwayOdds !== '' && spreadAwayTokenId) {
    teamBets.away.spread = {
      label: formatSpreadLine({ value: spreadLineValue, outcomeIndex: spreadOutcomeIndexes.away }),
      odds: formatOdds(spreadAwayOdds),
      outcomeTokenId: spreadAwayTokenId,
    };
  }
  if (spreadHomeOdds != null && spreadHomeOdds !== '' && spreadHomeTokenId) {
    teamBets.home.spread = {
      label: formatSpreadLine({ value: spreadLineValue, outcomeIndex: spreadOutcomeIndexes.home }),
      odds: formatOdds(spreadHomeOdds),
      outcomeTokenId: spreadHomeTokenId,
    };
  }

  if (moneyline.away.price != null && moneyline.away.price !== '' && moneyline.away.tokenId) {
    teamBets.away.moneyline = {
      label: '',
      odds: formatOdds(moneyline.away.price),
      outcomeTokenId: moneyline.away.tokenId,
    };
  }
  if (moneyline.home.price != null && moneyline.home.price !== '' && moneyline.home.tokenId) {
    teamBets.home.moneyline = {
      label: '',
      odds: formatOdds(moneyline.home.price),
      outcomeTokenId: moneyline.home.tokenId,
    };
  }

  if (totalsOverOdds != null && totalsOverOdds !== '' && totalsOverTokenId) {
    totals.over = {
      label: formatTotalLabel({ value: totalsLineValue, isOver: true }),
      odds: formatOdds(totalsOverOdds),
      outcomeTokenId: totalsOverTokenId,
    };
  }
  if (totalsUnderOdds != null && totalsUnderOdds !== '' && totalsUnderTokenId) {
    totals.under = {
      label: formatTotalLabel({ value: totalsLineValue, isOver: false }),
      odds: formatOdds(totalsUnderOdds),
      outcomeTokenId: totalsUnderTokenId,
    };
  }

  return { teamBets, totals };
}

export function getSportsEventTokenIds(event: PolymarketEvent): string[] {
  const betGrid = buildEventBetGrid(event);
  const outcomeTokenIds = [
    betGrid.teamBets.away.spread?.outcomeTokenId,
    betGrid.teamBets.away.moneyline?.outcomeTokenId,
    betGrid.totals.over?.outcomeTokenId,
    betGrid.teamBets.home.spread?.outcomeTokenId,
    betGrid.teamBets.home.moneyline?.outcomeTokenId,
    betGrid.totals.under?.outcomeTokenId,
  ].filter(Boolean) as string[];

  const tokenIds = outcomeTokenIds.map(tokenId => getPolymarketTokenId(tokenId, 'sell'));
  return Array.from(new Set(tokenIds));
}

function getPrimaryMarket(group?: LineBasedGroup): PolymarketMarket | undefined {
  if (!group) return undefined;
  const targetLine = Math.abs(group.mainLine);
  return group.markets.find(market => Math.abs(market.line) === targetLine) ?? group.markets[0];
}

function getTeamOutcomeIndexes(
  market: PolymarketMarket | undefined,
  teamReferences: Record<TeamSide, TeamReference>
): Record<TeamSide, number> {
  if (!market) return { away: 0, home: 1 };
  const awayMatch = getOutcomeIndexForTeam(market, teamReferences.away);
  const homeMatch = getOutcomeIndexForTeam(market, teamReferences.home);
  return resolveOutcomeIndexes(awayMatch, homeMatch);
}

function getOutcomeIndexForTeam(market: PolymarketMarket, reference: TeamReference) {
  if (!market.outcomes?.length) return null;
  const labels = getNormalizedTeamLabels(reference);
  if (labels.size === 0) return null;
  const index = market.outcomes.findIndex(outcome => labels.has(normalizeTeamLabel(outcome)));
  return index === -1 ? null : index;
}

function getMoneylineData(
  group: MoneylineGroup | undefined,
  teamReferences: Record<TeamSide, TeamReference>
): { away: MoneylineOutcome; home: MoneylineOutcome } {
  const empty = { price: undefined, tokenId: undefined };
  if (!group || !group.markets.length) return { away: empty, home: empty };

  if (!group.isThreeWay) {
    const market = group.markets[0];
    const indexes = getTeamOutcomeIndexes(market, teamReferences);
    return {
      away: { price: getOutcomePrice(market, indexes.away), tokenId: getOutcomeTokenId(market, indexes.away) },
      home: { price: getOutcomePrice(market, indexes.home), tokenId: getOutcomeTokenId(market, indexes.home) },
    };
  }

  const teamMarkets = group.markets.filter(market => !isDrawMarket(market));
  if (!teamMarkets.length) return { away: empty, home: empty };

  const awayMarket = findMarketForTeam(teamMarkets, teamReferences.away) ?? teamMarkets[0];
  const homeMarket =
    findMarketForTeam(teamMarkets, teamReferences.home) ??
    teamMarkets.find(market => market !== awayMarket) ??
    teamMarkets[1] ??
    teamMarkets[0];

  return {
    away: { price: getOutcomePrice(awayMarket, 0), tokenId: getOutcomeTokenId(awayMarket, 0) },
    home: { price: getOutcomePrice(homeMarket, 0), tokenId: getOutcomeTokenId(homeMarket, 0) },
  };
}

function findMarketForTeam(markets: PolymarketMarket[], reference: TeamReference) {
  const labels = getNormalizedTeamLabels(reference);
  if (labels.size === 0) return undefined;
  return markets.find(market => labels.has(normalizeTeamLabel(market.groupItemTitle ?? '')));
}

function getNormalizedTeamLabels(reference: TeamReference): Set<string> {
  const labels = new Set<string>();
  if (reference.team?.alias) labels.add(normalizeTeamLabel(reference.team.alias));
  if (reference.team?.name) labels.add(normalizeTeamLabel(reference.team.name));
  if (reference.team?.abbreviation) labels.add(normalizeTeamLabel(reference.team.abbreviation));
  if (reference.label) labels.add(normalizeTeamLabel(reference.label));
  labels.delete('');
  return labels;
}

function normalizeTeamLabel(value: string) {
  return value.trim().toLowerCase();
}

function getOutcomePrice(market: PolymarketMarket | undefined, outcomeIndex: number): string | undefined {
  if (!market) return undefined;
  return market.outcomePrices?.[outcomeIndex];
}

function getOutcomeTokenId(market: PolymarketMarket | undefined, outcomeIndex: number): string | undefined {
  if (!market) return undefined;
  return market.clobTokenIds?.[outcomeIndex];
}

function resolveOutcomeIndexes(awayMatch: number | null, homeMatch: number | null) {
  if (awayMatch == null && homeMatch == null) return { away: 0, home: 1 };
  if (awayMatch == null && homeMatch != null) return { away: homeMatch === 0 ? 1 : 0, home: homeMatch };
  if (awayMatch != null && homeMatch == null) return { away: awayMatch, home: awayMatch === 0 ? 1 : 0 };
  if (awayMatch === homeMatch) return { away: awayMatch ?? 0, home: awayMatch === 0 ? 1 : 0 };
  return { away: awayMatch ?? 0, home: homeMatch ?? 1 };
}

function formatSpreadLine({ value, outcomeIndex }: { value: number | undefined; outcomeIndex: number }) {
  if (value == null || Number.isNaN(value)) return '--';
  return `${outcomeIndex === 0 ? '-' : '+'}${Math.abs(value)}`;
}

function formatTotalLabel({ value, isOver }: { value: number | undefined; isOver: boolean }) {
  if (value == null || Number.isNaN(value)) return isOver ? 'O' : 'U';
  return `${isOver ? 'O' : 'U'} ${Math.abs(value)}`;
}
