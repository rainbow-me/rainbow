import { useCallback, useRef } from 'react';

import { useListen } from '@storesjs/stores';

import { type Game } from '@/features/sports/core/generated/sports';
import { getGame, useSportsStore } from '@/features/sports/data/sportsStore';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { useLiveTokenSubscription } from '@/state/liveTokens/useLiveTokenSubscription';

// ============ Types ========================================================== //

type PricedList = {
  ids: readonly string[];
  otherTokenIds: readonly string[];
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
 * Returns a callback that replaces the list's price subscriptions for game or event IDs and other tokens.
 * Follows token changes and releases the subscriptions on unmount.
 */
export function useSportsPriceSubscription(): (ids: readonly string[], otherTokenIds?: readonly string[]) => void {
  const subscribe = useLiveTokenSubscription();
  const priced = useRef<PricedList>({ ids: NO_IDS, otherTokenIds: NO_IDS, games: [] });

  const update = useCallback(
    (ids: readonly string[], otherTokenIds: readonly string[] = NO_IDS) => {
      const state = useSportsStore.getState();
      const previous = priced.current;
      const games = areArraysEqual(previous.ids, ids) ? previous.games : [];
      let tokensChanged = games !== previous.games || !areArraysEqual(previous.otherTokenIds, otherTokenIds);

      for (let i = 0; i < ids.length; i++) {
        const game = getGame(state, ids[i]);
        tokensChanged ||= !areGameTokensEqual(games[i], game);
        games[i] = game;
      }

      if (!tokensChanged) return;

      priced.current = { ids, otherTokenIds, games };
      subscribe(getTokenIds(games, otherTokenIds));
    },
    [subscribe]
  );

  useListen(
    useSportsStore,
    state => state,
    () => update(priced.current.ids, priced.current.otherTokenIds),
    { equalityFn: (previous, next) => previous.games === next.games && previous.eventGameIds === next.eventGameIds }
  );

  return update;
}

// ============ Helpers ======================================================== //

function getTokenIds(games: readonly (Game | undefined)[], otherTokenIds: readonly string[]): string[] {
  const tokenIds: string[] = [];

  for (const game of games) {
    if (!game) continue;

    for (const selectOutcome of OUTCOME_SELECTORS) {
      const outcome = selectOutcome(game);
      if (outcome) tokenIds.push(getPolymarketTokenId(outcome.tokenId, 'midpoint'));
    }
  }

  tokenIds.push(...otherTokenIds);
  return tokenIds;
}

function areGameTokensEqual(previous: Game | undefined, next: Game | undefined): boolean {
  if (previous === next) return true;
  if (!previous || !next) return false;
  return OUTCOME_SELECTORS.every(selectOutcome => selectOutcome(previous)?.tokenId === selectOutcome(next)?.tokenId);
}
