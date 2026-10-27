import { sportsApiBaseUrl } from '@/config/debug';
import { IS_DEV } from '@/env';
import { type SportsWindow } from '@/features/sports/core/browse';
import {
  type CatalogResult,
  type GamesForEventsResult,
  type GamesResult,
  type SearchGamesResult,
} from '@/features/sports/core/generated/common/sports/sports';
import {
  type GetCatalogRequest,
  type GetGamesForEventsRequest,
  type ListGamesRequest,
  type ListLiveGamesRequest,
  type SearchGamesRequest,
} from '@/features/sports/core/generated/external/sports/requests';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';
import { type PlatformResponse } from '@/resources/platform/types';

type BrowseRequest = Pick<ListGamesRequest, 'scopeId' | 'knownCatalogRevision'> & { window: SportsWindow };
type SearchRequest = Pick<SearchGamesRequest, 'query' | 'scopeId' | 'pageToken' | 'knownCatalogRevision'> & {
  window: Pick<SportsWindow, 'windowStartTime' | 'windowEndTime'>;
};

let localClient: RainbowFetchClient | undefined;

function getFetchClient(): RainbowFetchClient {
  if (!IS_DEV || !sportsApiBaseUrl) return getPlatformClient();
  return (localClient ??= new RainbowFetchClient({ ...getPlatformClient().opts, baseURL: `${sportsApiBaseUrl}/v1` }));
}

/**
 * Fetches Sports catalog and game data.
 */
export const sportsClient = {
  /**
   * Fetches the catalog and its revision. An unchanged catalog is omitted.
   */
  async getCatalog({ knownCatalogRevision }: GetCatalogRequest, abortController: AbortController | null): Promise<CatalogResult> {
    const { data } = await getFetchClient().get<PlatformResponse<CatalogResult>>('/sports/catalog', {
      abortController,
      params: knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) },
    });
    return data.result;
  },

  /**
   * Fetches live games across all sports.
   */
  async listLiveGames({ knownCatalogRevision }: ListLiveGamesRequest, abortController: AbortController | null): Promise<GamesResult> {
    const { data } = await getFetchClient().get<PlatformResponse<GamesResult>>('/sports/live', {
      abortController,
      params: knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) },
    });
    return data.result;
  },

  /**
   * Fetches live and scheduled games for a sport or competition.
   */
  async listGames({ scopeId, window, knownCatalogRevision }: BrowseRequest, abortController: AbortController | null): Promise<GamesResult> {
    const { data } = await getFetchClient().get<PlatformResponse<GamesResult>>('/sports/games', {
      abortController,
      params: {
        scopeId,
        windowStartTime: new Date(window.windowStartTime).toISOString(),
        todayCutoffTime: new Date(window.todayCutoffTime).toISOString(),
        windowEndTime: new Date(window.windowEndTime).toISOString(),
        ...(knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) }),
      },
    });
    return data.result;
  },

  /**
   * Finds games by their primary or child Polymarket event IDs.
   */
  async getGamesForEvents(
    { eventIds, knownCatalogRevision }: GetGamesForEventsRequest,
    abortController: AbortController | null
  ): Promise<GamesForEventsResult> {
    const params = eventIds.map(id => ['eventIds', id]);
    if (knownCatalogRevision !== undefined) params.push(['knownCatalogRevision', String(knownCatalogRevision)]);

    const { data } = await getFetchClient().get<PlatformResponse<GamesForEventsResult>>('/sports/games/lookup', {
      abortController,
      params,
    });
    return data.result;
  },

  /**
   * Searches games, returning a page of results in relevance order.
   */
  async searchGames(
    { query, scopeId, window, pageToken, knownCatalogRevision }: SearchRequest,
    abortController: AbortController | null
  ): Promise<SearchGamesResult> {
    const { data } = await getFetchClient().get<PlatformResponse<SearchGamesResult>>('/sports/search', {
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
    return data.result;
  },
};
