import { useCallback, useEffect } from 'react';

import { useListen } from '@storesjs/stores';

import { type Game } from '@/features/sports/core/generated/sports';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { useStableValue } from '@/hooks/useStableValue';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { useLiveTokenSubscription } from '@/state/liveTokens/useLiveTokenSubscription';

// ============ Types ========================================================== //

type PricedList = {
  gameIds: readonly string[];
  games: (Game | undefined)[];
};

// ============ Constants ====================================================== //

const NO_IDS: readonly string[] = [];

const OUTCOME_SELECTORS: readonly ((game: Game) => { tokenId: string } | undefined)[] = [
  game => game.participants[0]?.winner,
  game => game.participants[1]?.winner,
  game => game.spread?.outcomes[0],
  game => game.spread?.outcomes[1],
  game => game.winner?.draw,
];

// ============ Price Subscription ============================================= //

/**
 * Subscribes visible Games to live prices, following token changes until unmount.
 */
export function useSportsPriceSubscription(): (gameIds: readonly string[]) => void {
  const subscribe = useLiveTokenSubscription();
  const priced = useStableValue<PricedList>(() => ({ gameIds: NO_IDS, games: [] }));

  const update = useCallback(
    (gameIds: readonly string[]) => {
      const state = useSportsStore.getState();
      const games = areArraysEqual(priced.gameIds, gameIds) ? priced.games : [];
      let tokensChanged = games !== priced.games;

      for (let i = 0; i < gameIds.length; i++) {
        const game = state.games[gameIds[i]];
        tokensChanged ||= !areGameTokensEqual(games[i], game);
        games[i] = game;
      }

      if (!tokensChanged) return;

      priced.gameIds = gameIds;
      priced.games = games;
      subscribe(getTokenIds(games));
    },
    [priced, subscribe]
  );

  useListen(
    useSportsStore,
    state => state.games,
    () => update(priced.gameIds)
  );

  useEffect(() => {
    update(priced.gameIds);
    return () => {
      // Releasing the subscription invalidates the token comparison cache.
      priced.games = [];
    };
  }, [priced, update]);

  return update;
}

// ============ Helpers ======================================================== //

function getTokenIds(games: readonly (Game | undefined)[]): string[] {
  const tokenIds: string[] = [];

  for (const game of games) {
    if (!game) continue;

    for (const selectOutcome of OUTCOME_SELECTORS) {
      const outcome = selectOutcome(game);
      if (outcome) tokenIds.push(getPolymarketTokenId(outcome.tokenId, 'midpoint'));
    }
  }

  return tokenIds;
}

function areGameTokensEqual(previous: Game | undefined, next: Game | undefined): boolean {
  if (previous === next) return true;
  if (!previous || !next) return false;
  return OUTCOME_SELECTORS.every(selectOutcome => selectOutcome(previous)?.tokenId === selectOutcome(next)?.tokenId);
}
