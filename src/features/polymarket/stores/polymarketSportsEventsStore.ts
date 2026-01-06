import { rainbowFetch } from '@/rainbow-fetch';
import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { RawPolymarketEvent, PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { DEFAULT_SPORTS_LEAGUE_KEY, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { getSportsEventsStartTimeRange } from '@/features/polymarket/utils/getSportsEventsDateRange';
import { fetchTeamsForGameEvents } from '@/features/polymarket/utils/sports';

const VOLUME_MIN = '1000';

type PolymarketSportsEventsStoreState = {
  selectedLeagueId: string;
  setSelectedLeagueId: (leagueId: string) => void;
};

export const usePolymarketSportsEventsStore = createQueryStore<PolymarketEvent[], Record<string, never>, PolymarketSportsEventsStoreState>(
  {
    fetcher: fetchPolymarketSportsEvents,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(20),
  },
  set => ({
    selectedLeagueId: DEFAULT_SPORTS_LEAGUE_KEY,
    setSelectedLeagueId: (leagueId: string) => set({ selectedLeagueId: leagueId }),
  }),
  { storageKey: 'polymarketSportsEventsStore' }
);

export function prefetchPolymarketSportsEvents() {
  usePolymarketSportsEventsStore.getState().fetch();
}

async function fetchPolymarketSportsEvents(_: Record<string, never>, abortController: AbortController | null): Promise<PolymarketEvent[]> {
  const { minStartTime, maxStartTime } = getSportsEventsStartTimeRange();
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

  const filteredEvents = events.filter(event => event.ended !== true && event.gameId != null);

  const teamsByTicker = await fetchTeamsForGameEvents(filteredEvents);

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
