import { getHighContrastColor } from '@/__swaps__/utils/swaps';
import { buildGammaUrl } from '@/features/charts/polymarket/api/gammaClient';
import { type GammaMarket } from '@/features/charts/polymarket/types';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { getGammaLeagueId } from '@/features/polymarket/leagues';
import { type PolymarketGameMetadata, type PolymarketTeamInfo, type RawPolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketMarket, type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getColorBySeed } from '@/features/polymarket/utils/getColorBySeed';
import { mapWithConcurrency } from '@/framework/core/utils/mapWithConcurrency';
import { time } from '@/framework/core/utils/time';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { logger, RainbowError } from '@/logger';

type GameTeamsSource = {
  ticker?: string;
  homeTeamName?: string;
  awayTeamName?: string;
};

const TEAM_FETCH_CONCURRENCY = 4;

export async function fetchGameMetadata(eventTicker: string, abortController?: AbortController | null) {
  try {
    const url = new URL(`${POLYMARKET_GAMMA_API_URL}/games`);
    url.searchParams.set('ticker', eventTicker);
    const { data } = await rainbowFetch<PolymarketGameMetadata>(url.toString(), {
      signal: abortController?.signal,
      timeout: time.seconds(15),
    });
    return data;
  } catch (e) {
    // For some game types this information is not available and returns an error
    // There is no way to know which game types and this is expected behavior, so we do not log an error
    return null;
  }
}

async function fetchTeamsByAbbreviations(
  abbreviations: string[],
  league: string | undefined,
  abortController?: AbortController | null
): Promise<PolymarketTeamInfo[] | undefined> {
  try {
    const url = new URL(buildGammaUrl('teams'));
    if (league) {
      url.searchParams.set('league', league);
    }
    abbreviations.forEach(abbr => {
      url.searchParams.append('abbreviation', abbr);
    });
    const { data: rawTeams } = await rainbowFetch<RawPolymarketTeamInfo[]>(url.toString(), {
      signal: abortController?.signal,
      timeout: time.seconds(15),
    });
    if (!rawTeams) return undefined;
    const teams = enrichTeamsWithColor(rawTeams);
    return sortTeamsByAbbreviations(teams, abbreviations);
  } catch {
    return undefined;
  }
}

async function fetchTeamsByNames(
  names: string[],
  league: string | undefined,
  abortController?: AbortController | null
): Promise<PolymarketTeamInfo[] | undefined> {
  try {
    const url = new URL(buildGammaUrl('teams'));
    if (league) {
      url.searchParams.set('league', league);
    }
    names.forEach(name => {
      url.searchParams.append('name', name);
    });
    const { data: rawTeams } = await rainbowFetch<RawPolymarketTeamInfo[]>(url.toString(), {
      signal: abortController?.signal,
      timeout: time.seconds(15),
    });
    if (!rawTeams) return undefined;
    const teams = enrichTeamsWithColor(rawTeams);
    if (rawTeams.length > names.length) {
      return filterFetchedTeams(teams, names);
    }
    return sortTeamsByRequestedNames(teams, names);
  } catch (e) {
    if (!abortController?.signal.aborted) logger.error(new RainbowError('[Polymarket] Error fetching teams info', e));
    return undefined;
  }
}

export async function fetchTeamsForEvent(
  event: GameTeamsSource,
  abortController?: AbortController | null
): Promise<PolymarketTeamInfo[] | undefined> {
  if (!event.ticker) return undefined;

  const tickerAbbreviations = parseTeamAbbreviationsFromTicker(event.ticker);
  const gammaLeagueId = getGammaLeagueId(event.ticker);

  // Try abbreviation-based query first (more reliable - some team names fail Polymarket's validation)
  if (tickerAbbreviations) {
    const abbreviations = [tickerAbbreviations.away, tickerAbbreviations.home];
    const teams = await fetchTeamsByAbbreviations(abbreviations, gammaLeagueId, abortController);
    if (teams?.length === abbreviations.length) {
      return teams;
    }
  }

  let homeTeamName = event.homeTeamName;
  let awayTeamName = event.awayTeamName;
  if (!awayTeamName || !homeTeamName) {
    const gameMetadata = await fetchGameMetadata(event.ticker, abortController);
    if (gameMetadata) {
      // The `ordering` field represents the order in which the teams are listed in the game metadata.
      // This is not indicative of how the teams should be displayed in the event, which is always away @ home.
      if (gameMetadata.ordering === 'home') {
        homeTeamName = gameMetadata.teams[0];
        awayTeamName = gameMetadata.teams[1];
      } else {
        homeTeamName = gameMetadata.teams[1];
        awayTeamName = gameMetadata.teams[0];
      }
    }
  }

  if (homeTeamName && awayTeamName) {
    const teams = await fetchTeamsByNames([awayTeamName, homeTeamName], gammaLeagueId, abortController);
    if (teams?.length === 2) {
      return teams;
    }
  }
}

export async function fetchTeamsForGameMarkets(
  markets: RawPolymarketMarket[],
  abortController: AbortController | null
): Promise<Partial<Record<string, PolymarketTeamInfo[]>>> {
  const events: Record<string, GameTeamsSource> = {};
  const teams: Partial<Record<string, PolymarketTeamInfo[]>> = {};

  for (const market of markets) {
    const event = market.events[0];
    if (event?.gameId && event.ticker) events[event.ticker] ??= event;
  }

  await mapWithConcurrency(Object.keys(events), TEAM_FETCH_CONCURRENCY, async ticker => {
    if (abortController?.signal.aborted) return;
    const result = await fetchTeamsForEvent(events[ticker], abortController);
    if (result) teams[ticker] = result;
  });

  return teams;
}

export function parseTeamAbbreviationsFromTicker(ticker: string): { away: string; home: string } | null {
  const parts = ticker.split('-');
  if (parts.length < 4) return null;
  return { away: parts[1], home: parts[2] };
}

function sortTeamsByAbbreviations(teams: PolymarketTeamInfo[], abbreviations: string[]): PolymarketTeamInfo[] {
  const result: PolymarketTeamInfo[] = [];
  for (const abbr of abbreviations) {
    const normalized = abbr.trim().toLowerCase();
    const match = teams.find(team => team.abbreviation?.trim().toLowerCase() === normalized);
    if (match) result.push(match);
  }
  return result;
}

function sortTeamsByRequestedNames(teams: PolymarketTeamInfo[], teamNames: string[]): PolymarketTeamInfo[] {
  const result: PolymarketTeamInfo[] = [];
  for (const requestedName of teamNames) {
    const normalizedRequested = requestedName.trim().toLowerCase();
    const match = teams.find(team => team.name.trim().toLowerCase() === normalizedRequested);
    if (match) result.push(match);
  }
  return result;
}

/**
 * We don't always have access to the league, and team names can overlap across leagues.
 * Returns exactly one team per requested name, all from the same league.
 * Picks the league that can satisfy the most requested team names.
 */
function filterFetchedTeams(teams: PolymarketTeamInfo[], teamNames: string[]): PolymarketTeamInfo[] {
  const teamsByLeague = new Map<string, PolymarketTeamInfo[]>();
  for (const team of teams) {
    const existing = teamsByLeague.get(team.league) ?? [];
    existing.push(team);
    teamsByLeague.set(team.league, existing);
  }

  const normalizedRequestedNames = teamNames.map(name => name.trim().toLowerCase());
  let bestLeague = teams[0].league;
  let bestCoverage = 0;
  for (const [league, leagueTeams] of teamsByLeague.entries()) {
    const leagueTeamNames = new Set(leagueTeams.map(t => t.name.trim().toLowerCase()));
    const coverage = normalizedRequestedNames.filter(name => leagueTeamNames.has(name)).length;
    if (coverage > bestCoverage) {
      bestCoverage = coverage;
      bestLeague = league;
    }
  }

  const bestLeagueTeams = teamsByLeague.get(bestLeague) ?? [];
  return sortTeamsByRequestedNames(bestLeagueTeams, teamNames);
}

function enrichTeamsWithColor(teams: RawPolymarketTeamInfo[]): PolymarketTeamInfo[] {
  return teams.map(team => {
    const color = team.color ? getHighContrastColor(team.color) : getColorBySeed(String(team.id));
    return {
      ...team,
      color,
    };
  });
}

export function isDrawMarket(market: PolymarketMarket | GammaMarket): boolean {
  return market.slug.includes('-draw') || market.question.toLowerCase().includes('draw');
}
