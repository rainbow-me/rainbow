import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { logger, RainbowError } from '@/logger';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { PolymarketGameMetadata, PolymarketTeamInfo } from '@/features/polymarket/types';

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

export async function fetchTeamsInfo({ teamNames, league }: { teamNames: string[]; league: string | undefined }) {
  try {
    const url = new URL(`${POLYMARKET_GAMMA_API_URL}/teams`);
    if (league) {
      url.searchParams.set('league', league);
    }
    teamNames.forEach(name => {
      url.searchParams.append('name', name);
    });
    const { data: teams } = await rainbowFetch<PolymarketTeamInfo[]>(url.toString(), { timeout: time.seconds(15) });
    if (!teams) return undefined;
    if (teams.length > teamNames.length) {
      return filterFetchedTeams(teams, teamNames);
    }
    return sortTeamsByRequestedNames(teams, teamNames);
  } catch (e) {
    // This can fail unexpectedly, but should not prevent the event from being loaded
    logger.error(new RainbowError('[Polymarket] Error fetching teams info', e));
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
