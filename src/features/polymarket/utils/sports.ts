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
      return filterFetchedTeams(teams);
    }
    return teams;
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

/**
 * We don't always have access to the league, and team names can overlap across leagues
 * This is a hack to filter teams when we receive more than the amount of teams we expect
 * It returns the teams from the league with the most teams in the response
 */
function filterFetchedTeams(teams: PolymarketTeamInfo[]): PolymarketTeamInfo[] {
  const leagueCounts = new Map<string, number>();
  let leagueWithMostTeams = teams[0].league;

  for (const team of teams) {
    leagueCounts.set(team.league, (leagueCounts.get(team.league) ?? 0) + 1);
  }

  for (const [league, count] of leagueCounts.entries()) {
    if (count > (leagueCounts.get(leagueWithMostTeams) ?? 0)) {
      leagueWithMostTeams = league;
    }
  }

  return teams.filter(team => team.league === leagueWithMostTeams);
}
