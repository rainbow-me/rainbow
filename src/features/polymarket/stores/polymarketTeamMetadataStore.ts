import {
  fetchTeamMetadataForGameEvent,
  fetchTeamsForGameEvents,
  type GameTeamsMetadata,
  type GameTeamsSource,
} from '@/features/polymarket/utils/sports';
import { time } from '@/framework/core/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';

type TeamMetadataParams = {
  event: GameTeamsSource;
};

export const usePolymarketTeamMetadataStore = createQueryStore<GameTeamsMetadata | null, TeamMetadataParams>({
  enabled: false,
  fetcher: ({ event }, abortController) => fetchTeamMetadataForGameEvent(event, abortController),
  params: {
    event: { slug: '', ticker: '' },
  },
  staleTime: time.minutes(15),
  cacheTime: time.minutes(30),
});

export function fetchPolymarketTeamMetadataForGameEvents(
  events: GameTeamsSource[],
  abortController?: AbortController | null
): Promise<Map<string, GameTeamsMetadata>> {
  return fetchTeamsForGameEvents(events, abortController, fetchPolymarketTeamMetadataForGameEvent);
}

async function fetchPolymarketTeamMetadataForGameEvent(event: GameTeamsSource): Promise<GameTeamsMetadata | null> {
  if (!event.ticker) return null;
  return usePolymarketTeamMetadataStore.getState().fetch({ event }, { skipStoreUpdates: 'withCache' });
}
