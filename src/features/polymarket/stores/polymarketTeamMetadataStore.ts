import {
  fetchTeamMetadataForGameEvent,
  fetchTeamsForGameEvents,
  type GameTeamsMetadata,
  type GameTeamsSource,
} from '@/features/polymarket/utils/sports';
import { time } from '@/framework/core/utils/time';
import { createRainbowStore } from '@/state/internal/createRainbowStore';

const TEAM_METADATA_STALE_TIME = time.minutes(15);

type TeamMetadataCacheEntry = {
  data: GameTeamsMetadata;
  lastFetchedAt: number;
};

type PolymarketTeamMetadataState = {
  metadataByKey: Record<string, TeamMetadataCacheEntry>;
  fetchForGameEvent: (event: GameTeamsSource, abortController?: AbortController | null) => Promise<GameTeamsMetadata | null>;
};

function normalizeCacheKeyPart(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

// Keyed by ticker plus names (normalized) so an event that later arrives with names refetches a richer
// result, while casing/whitespace differences don't create duplicate entries.
function getTeamMetadataCacheKey(event: GameTeamsSource): string | null {
  const ticker = normalizeCacheKeyPart(event.ticker);
  if (!ticker) return null;
  return `ticker:${ticker}:${normalizeCacheKeyPart(event.awayTeamName)}:${normalizeCacheKeyPart(event.homeTeamName)}`;
}

export const usePolymarketTeamMetadataStore = createRainbowStore<PolymarketTeamMetadataState>((set, get) => ({
  metadataByKey: {},

  // Each call fetches with its own AbortController; the mapWithConcurrency pool already bounds fan-out,
  // so we don't share in-flight requests (which would couple one caller's abort to another's result).
  fetchForGameEvent: (event, abortController) => {
    const key = getTeamMetadataCacheKey(event);
    if (!key) return Promise.resolve(null);

    const cached = get().metadataByKey[key];
    if (cached && Date.now() - cached.lastFetchedAt < TEAM_METADATA_STALE_TIME) {
      return Promise.resolve(cached.data);
    }

    // Call the fetcher directly so the AbortController reaches rainbowFetch.
    return fetchTeamMetadataForGameEvent(event, abortController)
      .then(metadata => {
        // Skip caching empty lookups so a later, richer event can retry.
        if (metadata && (metadata.teams?.length || metadata.homeTeamName || metadata.awayTeamName)) {
          set(state => ({
            metadataByKey: {
              ...state.metadataByKey,
              [key]: { data: metadata, lastFetchedAt: Date.now() },
            },
          }));
        }
        return metadata;
      })
      .catch(() => null);
  },
}));

export function fetchPolymarketTeamMetadataForGameEvents(
  events: GameTeamsSource[],
  abortController?: AbortController | null
): Promise<Map<string, GameTeamsMetadata>> {
  return fetchTeamsForGameEvents(events, abortController, (event, controller) =>
    usePolymarketTeamMetadataStore.getState().fetchForGameEvent(event, controller)
  );
}
