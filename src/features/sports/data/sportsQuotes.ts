import { createDerivedStore, shallowEqual, type DeriveGetter } from '@storesjs/stores';

import { useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { type Route } from '@/navigation/routesNames';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

const EMPTY_TOKENS: string[] = [];

/** Follows the rendered, visible games owned by one list's quote subscription. */
export function subscribeToSportsQuotes(owner: symbol, route: Route): () => void {
  return subscribeToQuoteTokens(owner, route, $ => {
    const consumer = $(useSportsViewStore, state => state.quoteConsumers.get(owner));
    if (!consumer?.active) return EMPTY_TOKENS;

    return consumer.visibleGameIds.flatMap(gameId =>
      consumer.renderedGameIds.includes(gameId) ? ($(useSportsStore, state => state.quoteTokens[gameId]) ?? EMPTY_TOKENS) : EMPTY_TOKENS
    );
  });
}

/** Resolves quote demand from the lookup consumer's existing viewport intent. */
export function subscribeToSportsEventQuotes(owner: symbol, route: Route): () => void {
  return subscribeToQuoteTokens(owner, route, $ => {
    const consumer = $(useSportsViewStore, state => state.lookupConsumers.get(owner));
    if (!consumer?.active) return EMPTY_TOKENS;

    return consumer.visibleIds.flatMap(eventId => {
      if (!consumer.eventIds.includes(eventId)) return EMPTY_TOKENS;
      const gameId = $(useSportsStore, state => state.eventGames[eventId]);
      return gameId ? ($(useSportsStore, state => state.quoteTokens[gameId]) ?? EMPTY_TOKENS) : EMPTY_TOKENS;
    });
  });
}

function subscribeToQuoteTokens(owner: symbol, route: Route, readTokens: ($: DeriveGetter) => string[]): () => void {
  const tokens = createDerivedStore($ => ($(useSportsViewStore, state => state.appActive) ? readTokens($) : EMPTY_TOKENS), shallowEqual);
  const unsubscribe = tokens.subscribe(
    state => state,
    tokenIds => {
      useLiveTokensStore.getState().setSubscription(
        owner,
        route,
        tokenIds.map(tokenId => getPolymarketTokenId(tokenId, 'midpoint'))
      );
    },
    { fireImmediately: true }
  );

  return () => {
    unsubscribe();
    useLiveTokensStore.getState().removeSubscription(owner);
  };
}
