import { sportsApiBaseUrl } from '@/config/debug';
import { IS_DEV } from '@/env';
import { type SportsWindow } from '@/features/sports/core/browse';
import {
  GamesResult,
  GetCatalogResponse,
  GetGamesForEventsResponse,
  SearchGamesResponse,
  type GetCatalogRequest,
  type GetGamesForEventsRequest,
  type ListGamesRequest,
  type ListLiveGamesRequest,
  type SearchGamesRequest,
} from '@/features/sports/core/generated/sports';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';
import { type PlatformResponse } from '@/resources/platform/types';

type BrowseRequest = Pick<ListGamesRequest, 'scopeId' | 'knownCatalogRevision'> & { window: SportsWindow };
type SearchRequest = Pick<SearchGamesRequest, 'query' | 'scopeId' | 'pageToken' | 'knownCatalogRevision'> & {
  window: Pick<SportsWindow, 'windowStartTime' | 'windowEndTime'>;
};

/**
 * Sports service reads decoded with the generated protocol types. Uses the platform gateway, or the configured
 * local Sports endpoint in development. Requests share the caller's cancellation and propagate transport errors.
 * Schedule windows use epoch milliseconds and are serialized as ISO timestamps at this boundary.
 * Responses identify their catalog revision and include the catalog when it differs from `knownCatalogRevision`.
 */
export const sportsClient = {
  /** Reads the current catalog revision, omitting the catalog itself when the supplied revision is current. */
  async getCatalog({ knownCatalogRevision }: GetCatalogRequest, abortController: AbortController | null): Promise<GetCatalogResponse> {
    const { data } = await getFetchClient().get<unknown>('/sports/catalog', {
      abortController,
      params: knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) },
    });
    return GetCatalogResponse.fromJSON(data);
  },

  /**
   * At most thirty games per global Live group, in service-provided display order.
   */
  async listLiveGames({ knownCatalogRevision }: ListLiveGamesRequest, abortController: AbortController | null): Promise<GamesResult> {
    const { data } = await getFetchClient().get<unknown>('/sports/live', {
      abortController,
      params: knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) },
    });
    return GamesResult.fromJSON(data);
  },

  /**
   * A scope's live games and scheduled games in Today `[from, todayCutoffTime)` and Upcoming `[todayCutoffTime, until)`.
   * Each section contains at most thirty games. Live games remain eligible outside the scheduled interval.
   * Sports browsed by competition return only live games.
   */
  async listGames({ scopeId, window, knownCatalogRevision }: BrowseRequest, abortController: AbortController | null): Promise<GamesResult> {
    const { data } = await getFetchClient().get<unknown>('/sports/games', {
      abortController,
      params: {
        scopeId,
        windowStartTime: new Date(window.windowStartTime).toISOString(),
        todayCutoffTime: new Date(window.todayCutoffTime).toISOString(),
        windowEndTime: new Date(window.windowEndTime).toISOString(),
        ...(knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) }),
      },
    });
    return GamesResult.fromJSON(data);
  },

  /**
   * Resolves event IDs to canonical games. Each requested ID is resolved or unavailable;
   * several IDs may share a game, which appears only once in `games`.
   */
  async getGamesForEvents(
    { eventIds, knownCatalogRevision }: GetGamesForEventsRequest,
    abortController: AbortController | null
  ): Promise<GetGamesForEventsResponse> {
    const params = eventIds.map(id => ['eventIds', id]);
    if (knownCatalogRevision !== undefined) params.push(['knownCatalogRevision', String(knownCatalogRevision)]);

    const { data } = await getFetchClient().get<unknown>('/sports/games/lookup', {
      abortController,
      params,
    });
    return GetGamesForEventsResponse.fromJSON(data);
  },

  /**
   * Searches by relevance within the given time bounds, globally unless `scopeId` is supplied.
   * `nextPageToken` continues the same search; an expired or incompatible pageToken is rejected by the service.
   */
  async searchGames(
    { query, scopeId, window, pageToken, knownCatalogRevision }: SearchRequest,
    abortController: AbortController | null
  ): Promise<SearchGamesResponse> {
    const { data } = await getFetchClient().get<unknown>('/sports/search', {
      abortController,
      params: {
        query,
        ...(scopeId === undefined ? undefined : { scopeId }),
        windowStartTime: new Date(window.windowStartTime).toISOString(),
        windowEndTime: new Date(window.windowEndTime).toISOString(),
        ...(pageToken === undefined ? undefined : { pageToken }),
        ...(knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) }),
      },
    });
    return SearchGamesResponse.fromJSON(data);
  },
};

let localClient: RainbowFetchClient | undefined;

function getFetchClient(): RainbowFetchClient {
  if (!IS_DEV || !sportsApiBaseUrl) return getPlatformClient();
  return (localClient ??= new RainbowFetchClient({ ...getPlatformClient().opts, baseURL: `${sportsApiBaseUrl}/v1` }));
}
