import {
  fetchTeamMetadataForGameEvent,
  fetchTeamMetadataForGameEvents,
  type GameTeamsMetadata,
  type GameTeamsSource,
} from '@/features/polymarket/utils/sports';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type TeamMetadataParams = {
  ticker: string;
};

type TeamMetadataFetchContext = {
  abortController?: AbortController | null;
  event: GameTeamsSource;
};

const teamMetadataFetchContexts = new Map<string, TeamMetadataFetchContext>();

export const usePolymarketTeamMetadataStore = createQueryStore<GameTeamsMetadata | null, TeamMetadataParams>({
  enabled: false,
  fetcher: fetchPolymarketTeamMetadata,
  params: {
    ticker: '',
  },
  staleTime: time.minutes(15),
  cacheTime: time.minutes(30),
});

export function fetchPolymarketTeamMetadataForGameEvents(
  events: GameTeamsSource[],
  abortController?: AbortController | null
): Promise<Map<string, GameTeamsMetadata>> {
  return fetchTeamMetadataForGameEvents(events, abortController, fetchPolymarketTeamMetadataForGameEvent);
}

async function fetchPolymarketTeamMetadataForGameEvent(
  event: GameTeamsSource,
  abortController?: AbortController | null
): Promise<GameTeamsMetadata | null> {
  if (!event.ticker) return null;

  teamMetadataFetchContexts.set(event.ticker, { abortController, event });
  try {
    return await usePolymarketTeamMetadataStore.getState().fetch(
      { ticker: event.ticker },
      {
        skipStoreUpdates: 'withCache',
      }
    );
  } finally {
    teamMetadataFetchContexts.delete(event.ticker);
  }
}

async function fetchPolymarketTeamMetadata(
  { ticker }: TeamMetadataParams,
  abortController: AbortController | null
): Promise<GameTeamsMetadata | null> {
  const context = teamMetadataFetchContexts.get(ticker);
  const event = context?.event ?? { slug: ticker, ticker };
  return await fetchTeamMetadataForGameEvent(event, context?.abortController ?? abortController);
}
