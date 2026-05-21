import { navigateToPolymarketSportsLeague } from '@/features/discover/utils/navigation';
import { DEFAULT_SPORTS_LEAGUE_KEY } from '@/features/polymarket/constants';
import { PolymarketProvider } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { PolymarketSportsEventsScreen } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketSportsEventsScreen';

export function SportsSection() {
  return (
    <PolymarketProvider>
      <PolymarketSportsEventsScreen
        onPressLeagueHeader={navigateToPolymarketSportsLeague}
        renderAsStaticList
        selectedLeagueId={DEFAULT_SPORTS_LEAGUE_KEY}
        showLeagueSelector={false}
        truncateSections
      />
    </PolymarketProvider>
  );
}
