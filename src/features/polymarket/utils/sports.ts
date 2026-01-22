import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { logger, RainbowError } from '@/logger';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { getGammaLeagueId } from '@/features/polymarket/leagues';
import { PolymarketGameMetadata, RawPolymarketTeamInfo, PolymarketTeamInfo } from '@/features/polymarket/types';
import colors from '@/styles/colors';
import { addressHashedColorIndex } from '@/utils/profileUtils';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { buildGammaUrl } from '@/features/charts/polymarket/api/gammaClient';
import { PolymarketMarket, RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { GammaMarket } from '@/features/charts/polymarket/types';

export async function fetchGameMetadata(eventTicker: string) {
  try {
    const url = new URL(`${POLYMARKET_GAMMA_API_URL}/games`);
    url.searchParams.set('ticker', eventTicker);
    const { data } = await rainbowFetch<PolymarketGameMetadata>(url.toString(), { timeout: time.seconds(15) });
    return data;
  } catch (e) {
    // For some game types this information is not available and returns an error
    // There is no way to know which game types and this is expected behavior, so we do not log an error
    return null;
  }
}

async function fetchTeamsByAbbreviations(abbreviations: string[], league: string | undefined): Promise<PolymarketTeamInfo[] | undefined> {
  try {
    const url = new URL(buildGammaUrl('teams'));
    if (league) {
      url.searchParams.set('league', league);
    }
    abbreviations.forEach(abbr => {
      url.searchParams.append('abbreviation', abbr);
    });
    const { data: rawTeams } = await rainbowFetch<RawPolymarketTeamInfo[]>(url.toString(), { timeout: time.seconds(15) });
    if (!rawTeams) return undefined;
    const teams = enrichTeamsWithColor(rawTeams);
    return sortTeamsByAbbreviations(teams, abbreviations);
  } catch {
    return undefined;
  }
}

async function fetchTeamsByNames(names: string[], league: string | undefined): Promise<PolymarketTeamInfo[] | undefined> {
  try {
    const url = new URL(buildGammaUrl('teams'));
    if (league) {
      url.searchParams.set('league', league);
    }
    names.forEach(name => {
      url.searchParams.append('name', name);
    });
    const { data: rawTeams } = await rainbowFetch<RawPolymarketTeamInfo[]>(url.toString(), { timeout: time.seconds(15) });
    if (!rawTeams) return undefined;
    const teams = enrichTeamsWithColor(rawTeams);
    if (rawTeams.length > names.length) {
      return filterFetchedTeams(teams, names);
    }
    return sortTeamsByRequestedNames(teams, names);
  } catch (e) {
    logger.error(new RainbowError('[Polymarket] Error fetching teams info', e));
    return undefined;
  }
}

export async function fetchTeamsForEvent(event: GameTeamsSource): Promise<PolymarketTeamInfo[] | undefined> {
  if (!event.ticker) return undefined;

  const tickerAbbreviations = parseTeamAbbreviationsFromTicker(event.ticker);
  const gammaLeagueId = getGammaLeagueId(event.ticker);

  // Try abbreviation-based query first (more reliable - some team names fail Polymarket's validation)
  if (tickerAbbreviations) {
    const abbreviations = [tickerAbbreviations.away, tickerAbbreviations.home];
    const teams = await fetchTeamsByAbbreviations(abbreviations, gammaLeagueId);
    if (teams?.length === abbreviations.length) {
      return teams;
    }
  }

  let homeTeamName = event.homeTeamName;
  let awayTeamName = event.awayTeamName;
  if (!awayTeamName || !homeTeamName) {
    const gameMetadata = await fetchGameMetadata(event.ticker);
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
    const teams = await fetchTeamsByNames([awayTeamName, homeTeamName], gammaLeagueId);
    if (teams?.length === 2) {
      return teams;
    }
  }
}

type GameTeamsSource = {
  gameId?: number;
  ticker?: string;
  slug: string;
  homeTeamName?: string;
  awayTeamName?: string;
};

type GameTeamsMetadata = {
  teams?: PolymarketTeamInfo[];
  homeTeamName?: string;
  awayTeamName?: string;
};

export async function fetchTeamsForGameEvents(events: GameTeamsSource[]): Promise<Map<string, GameTeamsMetadata>> {
  const teamsMap = new Map<string, GameTeamsMetadata>();
  const gameEventsByTicker = new Map<string, GameTeamsSource>();

  for (const event of events) {
    if (event.gameId && event.ticker && !gameEventsByTicker.has(event.ticker)) {
      gameEventsByTicker.set(event.ticker, event);
    }
  }

  await Promise.all(
    Array.from(gameEventsByTicker.values()).map(async event => {
      if (!event.ticker) return;
      const teams = await fetchTeamsForEvent(event);
      teamsMap.set(event.ticker, { teams, homeTeamName: event.homeTeamName, awayTeamName: event.awayTeamName });
    })
  );

  return teamsMap;
}

export async function fetchTeamsForGameMarkets(markets: RawPolymarketMarket[]): Promise<Map<string, PolymarketTeamInfo[]>> {
  const marketEvents = markets.map(market => market.events[0]).filter(event => Boolean(event));
  const teamsMetadataMap = await fetchTeamsForGameEvents(marketEvents);
  const teamsMap = new Map<string, PolymarketTeamInfo[]>();

  teamsMetadataMap.forEach((metadata, ticker) => {
    if (metadata.teams) {
      teamsMap.set(ticker, metadata.teams);
    }
  });

  return teamsMap;
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
    const defaultColor = colors.avatarBackgrounds[addressHashedColorIndex(String(team.id)) ?? 0];
    const color = team.color ?? defaultColor;
    return {
      ...team,
      color: { light: getHighContrastColor(color, false), dark: getHighContrastColor(color, true) },
    };
  });
}

export type PolymarketEventGameInfo = {
  live: boolean;
  ended: boolean;
  score: string;
  period: string;
  elapsed: string;
  teams?: PolymarketTeamInfo[];
  startTime?: string;
};

type GameInfoSource = {
  live?: boolean;
  ended?: boolean;
  score?: string;
  period?: string;
  elapsed?: string;
  teams?: PolymarketTeamInfo[];
  startTime?: string;
};

type LiveGameSource = {
  live?: boolean;
  ended?: boolean;
  score?: string;
  period?: string;
  elapsed?: string;
};

export function selectGameInfo({ event, liveGame }: { event: GameInfoSource; liveGame?: LiveGameSource }): PolymarketEventGameInfo {
  return {
    live: liveGame?.live ?? event.live ?? false,
    ended: liveGame?.ended ?? event.ended ?? false,
    score: liveGame?.score ?? event.score ?? '',
    period: liveGame?.period ?? event.period ?? '',
    elapsed: liveGame?.elapsed ?? event.elapsed ?? '',
    teams: event.teams,
    startTime: event.startTime,
  };
}

export function parsePeriod(value: string) {
  const [currentPeriod, totalPeriods] = value.split('/');
  return {
    currentPeriod,
    totalPeriods,
  };
}

export function parseScore(value: string): { teamAScore?: string; teamBScore?: string; bestOf?: number } {
  if (value.includes('|')) {
    return parseBestOfScore(value);
  }
  if (value.includes(',')) {
    return { teamAScore: '', teamBScore: '' };
    // return parseTennisScore(value);
  }
  return parseRegularScore(value);
}

function parseRegularScore(value: string) {
  const [teamAScore, teamBScore] = value.split('-').map(part => part.trim());
  return { teamAScore, teamBScore };
}

// TODO: This has other considerations, current implementation is not correct
// function parseTennisScore(value: string) {
//   const setScores = value
//     .split(',')
//     .map(setScore => setScore.trim())
//     .filter(Boolean);
//   const teamAScores: string[] = [];
//   const teamBScores: string[] = [];

//   for (const setScore of setScores) {
//     const [teamAScore, teamBScore] = setScore.split('-').map(part => part.trim());
//     if (teamAScore) teamAScores.push(teamAScore);
//     if (teamBScore) teamBScores.push(teamBScore);
//   }

//   return {
//     teamAScore: teamAScores.join(', '),
//     teamBScore: teamBScores.join(', '),
//   };
// }

// Example: "000-000|1-1|Bo3"
// TODO: Handle UFC format "0-1|KO/TKO"
function parseBestOfScore(value: string) {
  const [, scorePart, bestOfPart] = value.split('|');
  const [teamAScore, teamBScore] = (scorePart ?? '').split('-');
  const bestOf = bestOfPart ? parseInt(bestOfPart.split('Bo')[1], 10) : undefined;
  return { teamAScore, teamBScore, bestOf };
}

export function isDrawMarket(market: PolymarketMarket | GammaMarket): boolean {
  return market.slug.includes('-draw') || market.question.toLowerCase().includes('draw');
}
