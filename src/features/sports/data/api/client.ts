import { sportsApiBaseUrl } from '@/config/debug';
import { IS_DEV } from '@/env';
import { type SportsWindow } from '@/features/sports/core/browse';
import {
  type GamesResult,
  type GetCatalogRequest,
  type GetCatalogResponse,
  type GetGamesRequest,
  type GetLiveGamesRequest,
  type LookupGamesRequest,
  type LookupGamesResponse,
  type SearchGamesRequest,
  type SearchGamesResponse,
} from '@/features/sports/core/generated/sports';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

type SportsResponse<T> = { result: T };

type BrowseRequest = Pick<GetGamesRequest, 'scopeId' | 'knownCatalogRevision'> & { window: SportsWindow };
type SearchRequest = Pick<SearchGamesRequest, 'query' | 'scopeId' | 'cursor' | 'knownCatalogRevision'> & {
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
  async getCatalog({ knownCatalogRevision }: GetCatalogRequest, abortController: AbortController | null): Promise<GetCatalogResponse> {
    const { data } = await getFetchClient().get<SportsResponse<GetCatalogResponse>>('/sports/catalog', {
      abortController,
      params: knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) },
    });
    return data.result;
  },

  /**
   * Fetches live games across all sports.
   */
  async getLiveGames({ knownCatalogRevision }: GetLiveGamesRequest, abortController: AbortController | null): Promise<GamesResult> {
    const { data } = await getFetchClient().get<SportsResponse<GamesResult>>('/sports/live', {
      abortController,
      params: knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) },
    });
    return data.result;
  },

  /**
   * Fetches live and scheduled games for a sport or competition.
   */
  async getGames({ scopeId, window, knownCatalogRevision }: BrowseRequest, abortController: AbortController | null): Promise<GamesResult> {
    const { data } = await getFetchClient().get<SportsResponse<GamesResult>>('/sports/games', {
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
  async lookupGames(
    { eventIds, knownCatalogRevision }: LookupGamesRequest,
    abortController: AbortController | null
  ): Promise<LookupGamesResponse> {
    const params = eventIds.map(id => ['eventIds', id]);
    if (knownCatalogRevision !== undefined) params.push(['knownCatalogRevision', String(knownCatalogRevision)]);

    const { data } = await getFetchClient().get<SportsResponse<LookupGamesResponse>>('/sports/games/lookup', {
      abortController,
      params,
    });
    return data.result;
  },

  /**
   * Searches games, returning a page of results in relevance order.
   */
  async searchGames(
    { query, scopeId, window, cursor, knownCatalogRevision }: SearchRequest,
    abortController: AbortController | null
  ): Promise<SearchGamesResponse> {
    const { data } = await getFetchClient().get<SportsResponse<SearchGamesResponse>>('/sports/search', {
      abortController,
      params: {
        query,
        ...(scopeId === undefined ? undefined : { scopeId }),
        windowStartTime: new Date(window.windowStartTime).toISOString(),
        windowEndTime: new Date(window.windowEndTime).toISOString(),
        ...(cursor === undefined ? undefined : { cursor }),
        ...(knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) }),
      },
    });
    return data.result;
  },
};
