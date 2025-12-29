import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { logger, RainbowError } from '@/logger';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { PolymarketGameMetadata, RawPolymarketTeamInfo, PolymarketTeamInfo } from '@/features/polymarket/types';
import colors from '@/styles/colors';
import { addressHashedColorIndex } from '@/utils/profileUtils';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { buildGammaUrl } from '@/features/charts/polymarket/api/gammaClient';

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

export async function fetchTeamsInfo({
  abbreviations,
  league,
  teamNames,
}: {
  abbreviations?: string[];
  league: string | undefined;
  teamNames: string[];
}) {
  // Try abbreviation-based query first (more reliable - some team names fail Polymarket's validation)
  if (abbreviations?.length) {
    const teams = await fetchTeamsByAbbreviations(abbreviations, league);
    if (teams?.length === abbreviations.length) {
      return teams;
    }
  }

  // Fall back to name-based query
  try {
    const url = new URL(buildGammaUrl('teams'));
    if (league) {
      url.searchParams.set('league', league);
    }
    teamNames.forEach(name => {
      url.searchParams.append('name', name);
    });
    const { data: rawTeams } = await rainbowFetch<RawPolymarketTeamInfo[]>(url.toString(), { timeout: time.seconds(15) });
    if (!rawTeams) return undefined;
    const teams = enrichTeamsWithColor(rawTeams);
    if (rawTeams.length > teamNames.length) {
      return filterFetchedTeams(teams, teamNames);
    }
    return sortTeamsByRequestedNames(teams, teamNames);
  } catch (e) {
    logger.error(new RainbowError('[Polymarket] Error fetching teams info', e));
    return undefined;
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

export async function fetchTeamsForGame(eventTicker: string): Promise<PolymarketTeamInfo[] | undefined> {
  const gameMetadata = await fetchGameMetadata(eventTicker);
  if (!gameMetadata) return undefined;

  const teamNames =
    gameMetadata.ordering === 'home' ? [gameMetadata.teams[0], gameMetadata.teams[1]] : [gameMetadata.teams[1], gameMetadata.teams[0]];

  // Field is named 'sport' but it is the league
  return fetchTeamsInfo({ teamNames, league: gameMetadata.sport });
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
