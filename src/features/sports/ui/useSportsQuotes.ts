import { useCallback, useEffect, useRef } from 'react';

import { useListen } from '@storesjs/stores';

import { useSportsStore } from '@/features/sports/data/sportsStore';
import { type Route } from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { useLiveTokenSubscription } from '@/state/liveTokens/useLiveTokenSubscription';

/** The list owns quote demand; its price leaves only consume shared values. */
export function useSportsQuotes(route: Route, visible: boolean, renderedGameIds: string[]): (gameIds: string[]) => void {
  const ids = useRef<string[]>([]);
  const rendered = useRef(new Set<string>());
  const active = useRef(false);
  const subscribe = useLiveTokenSubscription(route);

  const update = useCallback(() => {
    const tokens: string[] = [];
    if (active.current) {
      const { games } = useSportsStore.getState();
      for (const id of ids.current) {
        if (!rendered.current.has(id)) continue;
        const game = games[id];
        if (!game) continue;
        for (const participant of game.participants) {
          if (participant.winner) tokens.push(getPolymarketTokenId(participant.winner.tokenId, 'midpoint'));
        }
        for (const outcome of game.spread?.outcomes ?? []) tokens.push(getPolymarketTokenId(outcome.tokenId, 'midpoint'));
        if (game.winner?.draw) tokens.push(getPolymarketTokenId(game.winner.draw.tokenId, 'midpoint'));
      }
    }
    subscribe(tokens);
  }, [subscribe]);

  useEffect(() => {
    active.current = visible;
    rendered.current = new Set(renderedGameIds);
    update();
  }, [visible, renderedGameIds, update]);
  useListen(useSportsStore, state => state.games, update);

  return useCallback(
    gameIds => {
      ids.current = gameIds;
      update();
    },
    [update]
  );
}
