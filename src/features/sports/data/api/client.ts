import { sportsApiBaseUrl } from '@/config/debug';
import { type SportsWindow } from '@/features/sports/core/browse';
import {
  GetGamesResponse,
  LookupGamesResponse,
  SearchGamesResponse,
  SportsCatalog,
  type GetGamesRequest,
  type GetLiveGamesRequest,
  type LookupGamesRequest,
  type SearchGamesRequest,
} from '@/features/sports/core/generated/sports';
import { RainbowFetchClient } from '@/framework/data/http/rainbowFetch';
import { getPlatformClient } from '@/resources/platform/client';

let localClient: RainbowFetchClient | undefined;

function getClient(): RainbowFetchClient {
  if (!__DEV__ || !sportsApiBaseUrl) return getPlatformClient();
  return (localClient ??= new RainbowFetchClient({ ...getPlatformClient().opts, baseURL: `${sportsApiBaseUrl}/v1` }));
}

export const sportsClient = {
  async getCatalog(abortController: AbortController | null) {
    const { data } = await getClient().get<unknown>('/sports/catalog', { abortController });
    return SportsCatalog.fromJSON(data);
  },

  async getLiveGames({ scopeId }: GetLiveGamesRequest, abortController: AbortController | null) {
    const { data } = await getClient().get<unknown>('/sports/live', {
      abortController,
      params: scopeId === undefined ? undefined : { scopeId },
    });
    return GetGamesResponse.fromJSON(data);
  },

  async getGames({ scopeId, from, until }: GetGamesRequest & SportsWindow, abortController: AbortController | null) {
    const { data } = await getClient().get<unknown>('/sports/games', {
      abortController,
      params: { scopeId, from, until },
    });
    return GetGamesResponse.fromJSON(data);
  },

  async lookupGames({ eventIds }: LookupGamesRequest, abortController: AbortController | null) {
    const { data } = await getClient().get<unknown>('/sports/games/lookup', {
      abortController,
      params: eventIds.map(id => ['eventIds', id]),
    });
    return LookupGamesResponse.fromJSON(data);
  },

  async searchGames({ query, scopeId, from, until, cursor }: SearchGamesRequest & SportsWindow, abortController: AbortController | null) {
    const { data } = await getClient().get<unknown>('/sports/search', {
      abortController,
      params: {
        query,
        ...(scopeId !== undefined && { scopeId }),
        from,
        until,
        ...(cursor !== undefined && { cursor }),
      },
    });
    return SearchGamesResponse.fromJSON(data);
  },
};
