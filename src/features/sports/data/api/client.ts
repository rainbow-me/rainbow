import { sportsApiBaseUrl } from '@/config/debug';
import { IS_DEV } from '@/env';
import { type SportsWindow } from '@/features/sports/core/browse';
import {
  GetCatalogResponse,
  GetGamesResponse,
  LookupGamesResponse,
  SearchGamesResponse,
  type GetCatalogRequest,
  type GetGamesRequest,
  type GetLiveGamesRequest,
  type LookupGamesRequest,
  type SearchGamesRequest,
} from '@/features/sports/core/generated/sports';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

let localClient: RainbowFetchClient | undefined;

function getFetchClient(): RainbowFetchClient {
  if (!IS_DEV || !sportsApiBaseUrl) return getPlatformClient();
  return (localClient ??= new RainbowFetchClient({ ...getPlatformClient().opts, baseURL: `${sportsApiBaseUrl}/v1` }));
}

export const sportsClient = {
  async getCatalog({ knownCatalogRevision }: GetCatalogRequest, abortController: AbortController | null): Promise<GetCatalogResponse> {
    const { data } = await getFetchClient().get<unknown>('/sports/catalog', {
      abortController,
      params: knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) },
    });
    return GetCatalogResponse.fromJSON(data);
  },

  /**
   * At most thirty games per global Live group, ordered by promotion, start time, then ID.
   */
  async getLiveGames({ knownCatalogRevision }: GetLiveGamesRequest, abortController: AbortController | null): Promise<GetGamesResponse> {
    const { data } = await getFetchClient().get<unknown>('/sports/live', {
      abortController,
      params: knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) },
    });
    return GetGamesResponse.fromJSON(data);
  },

  /**
   * A scope's live games and scheduled games in Today `[from, todayUntil)` and Upcoming `[todayUntil, until)`.
   * Each section contains at most thirty games. Live games remain eligible outside the scheduled interval.
   * Sports browsed by competition return only live games.
   */
  async getGames(
    { scopeId, from, todayUntil, until, knownCatalogRevision }: GetGamesRequest & SportsWindow,
    abortController: AbortController | null
  ): Promise<GetGamesResponse> {
    const { data } = await getFetchClient().get<unknown>('/sports/games', {
      abortController,
      params: {
        scopeId,
        from,
        todayUntil,
        until,
        ...(knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) }),
      },
    });
    return GetGamesResponse.fromJSON(data);
  },

  async lookupGames(
    { eventIds, knownCatalogRevision }: LookupGamesRequest,
    abortController: AbortController | null
  ): Promise<LookupGamesResponse> {
    const params = eventIds.map(id => ['eventIds', id]);
    if (knownCatalogRevision !== undefined) params.push(['knownCatalogRevision', String(knownCatalogRevision)]);

    const { data } = await getFetchClient().get<unknown>('/sports/games/lookup', {
      abortController,
      params,
    });
    return LookupGamesResponse.fromJSON(data);
  },

  async searchGames(
    { query, scopeId, from, until, cursor, knownCatalogRevision }: SearchGamesRequest & Pick<SportsWindow, 'from' | 'until'>,
    abortController: AbortController | null
  ): Promise<SearchGamesResponse> {
    const { data } = await getFetchClient().get<unknown>('/sports/search', {
      abortController,
      params: {
        query,
        ...(scopeId === undefined ? undefined : { scopeId }),
        from,
        until,
        ...(cursor === undefined ? undefined : { cursor }),
        ...(knownCatalogRevision === undefined ? undefined : { knownCatalogRevision: String(knownCatalogRevision) }),
      },
    });
    return SearchGamesResponse.fromJSON(data);
  },
};
