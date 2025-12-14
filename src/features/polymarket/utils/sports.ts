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

export async function fetchTeamsInfo(teamNames: string[]) {
  try {
    const url = new URL(`${POLYMARKET_GAMMA_API_URL}/teams`);
    teamNames.forEach(name => {
      url.searchParams.append('name', name);
    });
    const { data } = await rainbowFetch<PolymarketTeamInfo[]>(url.toString(), { timeout: time.seconds(15) });
    return data;
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

  return fetchTeamsInfo(teamNames);
}
