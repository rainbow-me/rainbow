import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import {
  getMarketsGroupedByBetType,
  LineBasedGroup,
  MoneylineGroup,
} from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';
import { PolymarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { isDrawMarket } from '@/features/polymarket/utils/sports';
import { roundWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

// Team abbreviations are used when either team name exceeds this length
const MAX_TEAM_NAME_LENGTH = 14;

export type BetCellData = {
  label: string;
  odds: string;
  outcomeTokenId: string;
};

export type BetRow = {
  spread?: BetCellData;
  moneyline?: BetCellData;
  total?: BetCellData;
};

export type TeamDisplayInfo = {
  labels: [string, string];
  title: string;
};

export function getTeamDisplayInfo(event: PolymarketEvent): TeamDisplayInfo {
  let title = event.title;
  if (event.teams?.length && event.teams.length >= 2) {
    const teamA = event.teams[0];
    const teamB = event.teams[1];
    let labels: [string, string] = [teamA.name, teamB.name];
    if (
      (teamA.name.length > MAX_TEAM_NAME_LENGTH || teamB.name.length > MAX_TEAM_NAME_LENGTH) &&
      teamA.abbreviation &&
      teamB.abbreviation
    ) {
      labels = [teamA.abbreviation.toUpperCase(), teamB.abbreviation.toUpperCase()];
    }
    title = `${teamA.name} vs. ${teamB.name}`;
    return { labels, title };
  }
  if (event.awayTeamName && event.homeTeamName) {
    const labels: [string, string] = [event.awayTeamName, event.homeTeamName];
    title = `${event.awayTeamName} vs. ${event.homeTeamName}`;
    return { labels, title };
  }
  return { labels: ['', ''], title: event.title };
}

export function buildBetRows(event: PolymarketEvent): { top: BetRow; bottom: BetRow } {
  const grouped = getMarketsGroupedByBetType({
    ...event,
    markets: event.markets.filter(market => market.active && !market.closed),
  });

  const matchLabels = getTeamMatchLabels(event);
  const spreadGroup = grouped.spreads.find(group => group.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.SPREADS) ?? grouped.spreads[0];
  const totalsGroup = grouped.totals.find(group => group.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.TOTALS) ?? grouped.totals[0];
  const moneylineGroup =
    grouped.moneyline.find(group => group.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE) ?? grouped.moneyline[0];

  const spreadLine = getPrimaryLine(spreadGroup);
  const totalsLine = getPrimaryLine(totalsGroup);
  const moneyline = getMoneylineData(moneylineGroup, matchLabels);

  const spreadLineValue = spreadLine?.value;
  const totalsLineValue = totalsLine?.value;
  const spreadOutcomeIndexes = getOutcomeIndexes(spreadLine?.market, matchLabels);
  const spreadTopOdds = getOutcomePrice(spreadLine?.market, spreadOutcomeIndexes.top);
  const spreadBottomOdds = getOutcomePrice(spreadLine?.market, spreadOutcomeIndexes.bottom);
  const totalsTopOdds = getOutcomePrice(totalsLine?.market, 0);
  const totalsBottomOdds = getOutcomePrice(totalsLine?.market, 1);
  const spreadTopTokenId = getOutcomeTokenId(spreadLine?.market, spreadOutcomeIndexes.top);
  const spreadBottomTokenId = getOutcomeTokenId(spreadLine?.market, spreadOutcomeIndexes.bottom);
  const totalsTopTokenId = getOutcomeTokenId(totalsLine?.market, 0);
  const totalsBottomTokenId = getOutcomeTokenId(totalsLine?.market, 1);

  const top: BetRow = {};
  const bottom: BetRow = {};

  if (spreadTopOdds != null && spreadTopOdds !== '' && spreadTopTokenId) {
    top.spread = {
      label: formatSpreadLine({ value: spreadLineValue, outcomeIndex: spreadOutcomeIndexes.top }),
      odds: formatOdds(spreadTopOdds),
      outcomeTokenId: spreadTopTokenId,
    };
  }
  if (spreadBottomOdds != null && spreadBottomOdds !== '' && spreadBottomTokenId) {
    bottom.spread = {
      label: formatSpreadLine({ value: spreadLineValue, outcomeIndex: spreadOutcomeIndexes.bottom }),
      odds: formatOdds(spreadBottomOdds),
      outcomeTokenId: spreadBottomTokenId,
    };
  }

  if (moneyline.top.price != null && moneyline.top.price !== '' && moneyline.top.tokenId) {
    top.moneyline = {
      label: '',
      odds: formatOdds(moneyline.top.price),
      outcomeTokenId: moneyline.top.tokenId,
    };
  }
  if (moneyline.bottom.price != null && moneyline.bottom.price !== '' && moneyline.bottom.tokenId) {
    bottom.moneyline = {
      label: '',
      odds: formatOdds(moneyline.bottom.price),
      outcomeTokenId: moneyline.bottom.tokenId,
    };
  }

  if (totalsTopOdds != null && totalsTopOdds !== '' && totalsTopTokenId) {
    top.total = {
      label: formatTotalLabel({ value: totalsLineValue, isOver: true }),
      odds: formatOdds(totalsTopOdds),
      outcomeTokenId: totalsTopTokenId,
    };
  }
  if (totalsBottomOdds != null && totalsBottomOdds !== '' && totalsBottomTokenId) {
    bottom.total = {
      label: formatTotalLabel({ value: totalsLineValue, isOver: false }),
      odds: formatOdds(totalsBottomOdds),
      outcomeTokenId: totalsBottomTokenId,
    };
  }

  return { top, bottom };
}

export function formatOdds(value?: string) {
  if (value == null || value === '') return '--';
  return `${roundWorklet(toPercentageWorklet(value))}%`;
}

export function getSportsEventTokenIds(event: PolymarketEvent): string[] {
  const betRows = buildBetRows(event);
  const outcomeTokenIds = [
    betRows.top.spread?.outcomeTokenId,
    betRows.top.moneyline?.outcomeTokenId,
    betRows.top.total?.outcomeTokenId,
    betRows.bottom.spread?.outcomeTokenId,
    betRows.bottom.moneyline?.outcomeTokenId,
    betRows.bottom.total?.outcomeTokenId,
  ].filter(Boolean) as string[];

  const tokenIds = outcomeTokenIds.map(tokenId => getPolymarketTokenId(tokenId, 'sell'));
  return Array.from(new Set(tokenIds));
}

function getPrimaryLine(group?: LineBasedGroup) {
  if (!group?.lines.length) return null;
  const targetLine = Math.abs(group.mainLine);
  return group.lines.find(line => Math.abs(line.value) === targetLine) ?? group.lines[0];
}

function getTeamMatchLabels(event: PolymarketEvent): [string, string] {
  if (event.teams?.length && event.teams.length >= 2) {
    return [event.teams[0].name, event.teams[1].name];
  }
  if (event.awayTeamName && event.homeTeamName) {
    return [event.awayTeamName, event.homeTeamName];
  }
  return ['', ''];
}

type MoneylineOutcome = { price: string | undefined; tokenId: string | undefined };

function getMoneylineData(
  group: MoneylineGroup | undefined,
  teamLabels: [string, string]
): { top: MoneylineOutcome; bottom: MoneylineOutcome } {
  const empty = { price: undefined, tokenId: undefined };
  if (!group || !group.markets.length) return { top: empty, bottom: empty };

  if (!group.isThreeWay) {
    const market = group.markets[0];
    const indexes = getOutcomeIndexes(market, teamLabels);
    return {
      top: { price: getOutcomePrice(market, indexes.top), tokenId: getOutcomeTokenId(market, indexes.top) },
      bottom: { price: getOutcomePrice(market, indexes.bottom), tokenId: getOutcomeTokenId(market, indexes.bottom) },
    };
  }

  const teamMarkets = group.markets.filter(market => !isDrawMarket(market));
  if (!teamMarkets.length) return { top: empty, bottom: empty };

  const topMarket = matchMarketToTeam(teamMarkets, teamLabels[0]) ?? teamMarkets[0];
  const bottomMarket = matchMarketToTeam(teamMarkets, teamLabels[1]) ?? teamMarkets[1] ?? teamMarkets[0];

  return {
    top: { price: getOutcomePrice(topMarket, 0), tokenId: getOutcomeTokenId(topMarket, 0) },
    bottom: { price: getOutcomePrice(bottomMarket, 0), tokenId: getOutcomeTokenId(bottomMarket, 0) },
  };
}

function matchMarketToTeam(markets: PolymarketMarket[], teamLabel: string) {
  const normalized = normalize(teamLabel);
  if (!normalized) return undefined;
  return markets.find(market => {
    const groupTitle = normalize(market.groupItemTitle ?? '');
    const question = normalize(market.question ?? '');
    return groupTitle.includes(normalized) || question.includes(normalized);
  });
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getOutcomePrice(market: PolymarketMarket | undefined, outcomeIndex: number): string | undefined {
  if (!market) return undefined;
  return market.outcomePrices?.[outcomeIndex];
}

function getOutcomeTokenId(market: PolymarketMarket | undefined, outcomeIndex: number): string | undefined {
  if (!market) return undefined;
  return market.clobTokenIds?.[outcomeIndex];
}

function getOutcomeIndexes(market: PolymarketMarket | undefined, teamLabels: [string, string]) {
  if (!market) return { top: 0, bottom: 1 };
  const topMatch = getOutcomeIndexByTeam(market, teamLabels[0]);
  const bottomMatch = getOutcomeIndexByTeam(market, teamLabels[1]);
  return resolveOutcomeIndexes(topMatch, bottomMatch);
}

function getOutcomeIndexByTeam(market: PolymarketMarket, teamLabel: string) {
  const normalized = normalize(teamLabel);
  if (!normalized || !market.outcomes?.length) return null;
  const index = market.outcomes.findIndex(outcome => {
    const normalizedOutcome = normalize(outcome);
    return normalizedOutcome.includes(normalized) || normalized.includes(normalizedOutcome);
  });
  return index === -1 ? null : index;
}

function resolveOutcomeIndexes(topMatch: number | null, bottomMatch: number | null) {
  if (topMatch == null && bottomMatch == null) return { top: 0, bottom: 1 };
  if (topMatch == null && bottomMatch != null) return { top: bottomMatch === 0 ? 1 : 0, bottom: bottomMatch };
  if (topMatch != null && bottomMatch == null) return { top: topMatch, bottom: topMatch === 0 ? 1 : 0 };
  if (topMatch === bottomMatch) return { top: topMatch ?? 0, bottom: topMatch === 0 ? 1 : 0 };
  return { top: topMatch ?? 0, bottom: bottomMatch ?? 1 };
}

function formatSpreadLine({ value, outcomeIndex }: { value: number | undefined; outcomeIndex: number }) {
  if (value == null || Number.isNaN(value)) return '--';
  return `${outcomeIndex === 0 ? '-' : '+'}${Math.abs(value)}`;
}

function formatTotalLabel({ value, isOver }: { value: number | undefined; isOver: boolean }) {
  if (value == null || Number.isNaN(value)) return isOver ? 'O' : 'U';
  return `${isOver ? 'O' : 'U'} ${Math.abs(value)}`;
}
