import { IS_TEST } from '@/env';
import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { DEFAULT_SPORTS_LEAGUE_KEY, POLYMARKET_GAMMA_API_URL, POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { type LeagueId } from '@/features/polymarket/leagues';
import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getSportsEventsDayBoundaries, getSportsEventsStartTimeRange } from '@/features/polymarket/utils/getSportsEventsDateRange';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { time } from '@/framework/core/utils/time';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';

const VOLUME_MIN = '1000';

export type PolymarketSportsLeagueId = LeagueId | typeof DEFAULT_SPORTS_LEAGUE_KEY;

type PolymarketSportsEventsStoreState = {
  selectedLeagueId: PolymarketSportsLeagueId;
  setSelectedLeagueId: (leagueId: PolymarketSportsLeagueId) => void;
};

const usePolymarketSportsEventsEnabled = createDerivedStore<boolean>(
  $ => {
    const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
    const localEnabled = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));

    return !IS_TEST && (remoteEnabled || localEnabled);
  },
  { fastMode: true }
);

export const usePolymarketSportsEventsStore = createQueryStore<PolymarketEvent[], never, PolymarketSportsEventsStoreState>(
  {
    fetcher: fetchPolymarketSportsEvents,
    enabled: $ => $(usePolymarketSportsEventsEnabled),
    staleTime: time.minutes(2),
    cacheTime: time.minutes(20),
  },
  set => ({
    selectedLeagueId: DEFAULT_SPORTS_LEAGUE_KEY,
    setSelectedLeagueId: (leagueId: PolymarketSportsLeagueId) => set({ selectedLeagueId: leagueId }),
  })
);

export function prefetchPolymarketSportsEvents() {
  if (!usePolymarketSportsEventsStore.getState().enabled) return;
  usePolymarketSportsEventsStore.getState().fetch();
}

export async function fetchPolymarketSportsEvents(_: never, abortController: AbortController | null): Promise<PolymarketEvent[]> {
  const { minStartTime, maxStartTime } = getSportsEventsStartTimeRange();
  const { startOfToday, startOfTomorrow } = getSportsEventsDayBoundaries();
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/events`);
  url.searchParams.set('limit', '500');
  url.searchParams.set('tag_slug', 'games');
  url.searchParams.set('active', 'true');
  url.searchParams.set('archived', 'false');
  url.searchParams.set('closed', 'false');
  url.searchParams.set('order', 'volume');
  url.searchParams.set('ascending', 'false');
  url.searchParams.set('start_time_min', minStartTime);
  url.searchParams.set('start_time_max', maxStartTime);
  url.searchParams.set('volume_min', VOLUME_MIN);

  const { data: events }: { data: RawPolymarketEvent[] } = await rainbowFetch(url.toString(), {
    abortController,
    timeout: time.seconds(30),
  });

  const filteredEvents = events.filter(event => {
    if (event.gameId == null) return false;

    const hasActiveMoneylineMarket = event.markets.some(
      market =>
        market.active !== false &&
        market.closed !== true &&
        market.umaResolutionStatus !== 'resolved' &&
        market.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE
    );
    if (!hasActiveMoneylineMarket) return false;
    if (event.ended !== true) return true;

    const timestamp = new Date(event.startTime || event.endDate).getTime();
    return timestamp >= startOfToday.getTime() && timestamp < startOfTomorrow.getTime();
  });

  const teamsByTicker = await fetchPolymarketTeamMetadataForGameEvents(filteredEvents, abortController);

  return await Promise.all(
    filteredEvents.map(event => {
      const teamMetadata = event.ticker ? teamsByTicker.get(event.ticker) : undefined;
      if (teamMetadata?.homeTeamName) {
        event.homeTeamName = teamMetadata.homeTeamName;
      }
      if (teamMetadata?.awayTeamName) {
        event.awayTeamName = teamMetadata.awayTeamName;
      }

      return processRawPolymarketEvent(event, teamMetadata?.teams);
    })
  );
}
