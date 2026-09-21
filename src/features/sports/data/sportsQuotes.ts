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

    return consumer.visibleGameIds.flatMap(gameId => (consumer.renderedGameIds.includes(gameId) ? getGameTokens($, gameId) : EMPTY_TOKENS));
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
      return gameId ? getGameTokens($, gameId) : EMPTY_TOKENS;
    });
  });
}

function subscribeToQuoteTokens(owner: symbol, route: Route, readTokens: ($: DeriveGetter) => string[]): () => void {
  const tokens = createDerivedStore($ => {
    if (!$(useSportsViewStore, state => state.appActive)) return EMPTY_TOKENS;
    return readTokens($).map(tokenId => getPolymarketTokenId(tokenId, 'midpoint'));
  }, shallowEqual);
  const unsubscribe = tokens.subscribe(
    state => state,
    tokenIds => useLiveTokensStore.getState().setSubscription(owner, route, tokenIds),
    { fireImmediately: true }
  );

  return () => {
    unsubscribe();
    useLiveTokensStore.getState().removeSubscription(owner);
  };
}

function getGameTokens($: DeriveGetter, gameId: string): string[] {
  const tokens = [
    $(useSportsStore, state => state.games[gameId]?.participants[0]?.winner?.tokenId),
    $(useSportsStore, state => state.games[gameId]?.participants[1]?.winner?.tokenId),
    $(useSportsStore, state => state.games[gameId]?.spread?.outcomes[0]?.tokenId),
    $(useSportsStore, state => state.games[gameId]?.spread?.outcomes[1]?.tokenId),
    $(useSportsStore, state => state.games[gameId]?.winner?.draw?.tokenId),
  ];
  return tokens.filter((token): token is string => token !== undefined);
}
