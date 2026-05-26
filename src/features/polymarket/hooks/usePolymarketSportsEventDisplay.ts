import { useMemo } from 'react';

import { usePolymarketLiveGame } from '@/features/polymarket/hooks/usePolymarketLiveGame';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { parseScore, selectGameInfo } from '@/features/polymarket/utils/sports';
import { buildEventBetGrid } from '@/features/polymarket/utils/sportsEventBetData';
import { getTeamDisplayInfo } from '@/features/polymarket/utils/sportsEventTeams';

export function usePolymarketSportsEventDisplay(event: PolymarketEvent) {
  const liveGame = usePolymarketLiveGame(event.live && !event.ended ? event.gameId : undefined);
  const gameInfo = useMemo(() => selectGameInfo({ event, liveGame }), [event, liveGame]);
  const isLive = gameInfo.live && !gameInfo.ended;
  const showScores = isLive || gameInfo.ended;
  const { labels: teamLabels, title } = useMemo(() => getTeamDisplayInfo(event), [event]);
  const scores = useMemo(() => (showScores && gameInfo.score ? parseScore(gameInfo.score) : null), [gameInfo.score, showScores]);
  const betGrid = useMemo(() => buildEventBetGrid(event), [event]);

  return {
    betGrid,
    gameInfo,
    isLive,
    scores,
    showScores,
    teamLabels,
    title,
  };
}
