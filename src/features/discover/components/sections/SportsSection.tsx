import { PolymarketProvider } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { PolymarketSportsEventsScreen } from '@/features/polymarket/screens/polymarket-sports-events-screen/PolymarketSportsEventsScreen';

export function SportsSection() {
  return (
    <PolymarketProvider>
      <PolymarketSportsEventsScreen onScroll={() => {}} />
    </PolymarketProvider>
  );
}
