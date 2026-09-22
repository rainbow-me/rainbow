import { createDerivedStore, shallowEqual, type DerivedStore } from '@storesjs/stores';

import { useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { type Route } from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { useNavigationStore } from '@/state/navigation/navigationStore';

const EMPTY_TOKENS: string[] = [];

export function createSportsQuoteStore(owner: symbol, route: Route): DerivedStore<string[]> {
  return createDerivedStore($ => {
    if (!$(useSportsViewStore, s => s.appActive)) return EMPTY_TOKENS;
    if (!$(useNavigationStore, s => s.activeRoute === route)) return EMPTY_TOKENS;

    const consumer = $(useSportsViewStore, s => s.quoteConsumers.get(owner));
    if (!consumer) return EMPTY_TOKENS;

    const tokens: string[] = [];

    for (const gameId of consumer.visibleGameIds) {
      if (!consumer.renderedGameIds.includes(gameId)) continue;

      const gameTokens = $(useSportsStore, s => s.games[gameId]?.quoteTokenIds);
      for (const tokenId of gameTokens ?? EMPTY_TOKENS) {
        tokens.push(getPolymarketTokenId(tokenId, 'midpoint'));
      }
    }

    return tokens;
  }, shallowEqual);
}

export function createSportsEventQuoteStore(owner: symbol): DerivedStore<string[]> {
  return createDerivedStore($ => {
    if (!$(useSportsViewStore, s => s.appActive)) return EMPTY_TOKENS;

    const consumer = $(useSportsViewStore, s => s.lookupConsumers.get(owner));
    if (!consumer?.active) return EMPTY_TOKENS;

    const tokens: string[] = [];

    for (const eventId of consumer.visibleIds) {
      if (!consumer.eventIds.includes(eventId)) continue;

      const gameTokens = $(useSportsStore, s => {
        const gameId = s.eventGames[eventId];
        return gameId ? s.games[gameId]?.quoteTokenIds : undefined;
      });
      for (const tokenId of gameTokens ?? EMPTY_TOKENS) {
        tokens.push(getPolymarketTokenId(tokenId, 'midpoint'));
      }
    }

    return tokens;
  }, shallowEqual);
}
