import { useEffect } from 'react';
import { polymarketSportsWsClient } from '@/features/polymarket/realtime/polymarketSportsWsClient';
import { usePolymarketLiveGameStore } from '@/features/polymarket/stores/polymarketLiveGameStore';

export function usePolymarketLiveGame(gameId?: number | null) {
  const liveGame = usePolymarketLiveGameStore(state => (gameId ? state.gamesById[String(gameId)] : undefined));

  useEffect(() => {
    if (!gameId) return;
    polymarketSportsWsClient.start();
    return () => {
      polymarketSportsWsClient.stop();
    };
  }, [gameId]);

  return liveGame;
}
