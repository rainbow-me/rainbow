import { createBaseStore, createQueryStore, type QueryStore } from '@storesjs/stores';

import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { time } from '@/framework/core/utils/time';
import { greaterThan, multiply } from '@/helpers/utilities';
import Routes, { type Route } from '@/navigation/routesNames';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useNavigationStore, type NavigationState } from '@/state/navigation/navigationStore';

import { useUserAssetsStore } from '../assets/userAssets';
import { fetchLiveTokens, type LiveTokensParams } from './fetchLiveTokens';
import { type LiveTokensData, type TokenData } from './types';

export type { TokenData, LiveTokensData, PriceReliabilityStatus } from './types';

type LiveTokensStore = {
  tokens: LiveTokensData;
  /** Subscribes to a token until the returned cleanup function is called. */
  subscribeToToken: (route: Route, tokenId: string) => () => void;
  /** Replaces one subscriber's token set without changing other subscribers' counts. */
  replaceSubscribedTokens: (route: Route, previous: ReadonlySet<string>, next: ReadonlySet<string>) => void;
};

const DEFAULT_STALE_TIME = time.seconds(5);
const FAST_REFRESH_STALE_TIME = time.seconds(2);
const EMPTY_TOKEN_IDS: readonly string[] = [];

/**
 * Polls subscribed tokens on the active route while the app is active.
 * Cached quotes remain available after the last subscription is released.
 */
export const useLiveTokensStore = createLiveTokensStore();

function createLiveTokensStore(): QueryStore<LiveTokensData | null, LiveTokensParams, LiveTokensStore> {
  const subscriptionCountsByRoute = new Map<Route, Map<string, number>>();
  const tokenIdsByRoute = createBaseStore<Partial<Record<Route, readonly string[]>>>(() => ({}));

  function updateSubscriptionCount(route: Route, tokenId: string, change: 1 | -1): boolean {
    let counts = subscriptionCountsByRoute.get(route);
    const previous = counts?.get(tokenId) ?? 0;
    if (!previous && change === -1) return false;

    const next = previous + change;
    if (next) {
      if (!counts) {
        counts = new Map();
        subscriptionCountsByRoute.set(route, counts);
      }
      counts.set(tokenId, next);
    } else if (counts) {
      counts.delete(tokenId);
      if (!counts.size) subscriptionCountsByRoute.delete(route);
    }

    return previous === 0 || next === 0;
  }

  function publishTokens(route: Route): void {
    const counts = subscriptionCountsByRoute.get(route);

    tokenIdsByRoute.setState(state => {
      const next = { ...state };
      if (counts) next[route] = Array.from(counts.keys()).sort();
      else delete next[route];
      return next;
    }, true);
  }

  return createQueryStore<LiveTokensData | null, LiveTokensParams, LiveTokensStore>(
    {
      fetcher: fetchLiveTokens,
      enabled: $ => $(useAppStateStore, s => s === 'active'),
      staleTime: $ => $(useNavigationStore, determineStaleTime),
      setData: context => {
        const data = context.data;
        if (data) context.set(state => ({ tokens: { ...state.tokens, ...data } }));
      },
      onFetched: context => {
        const data = context.data;
        if (data) useUserAssetsStore.getState().updateTokens(data);
      },

      disableCache: true,
      paramChangeThrottle: time.ms(250),
      params: {
        currency: $ => $(userAssetsStoreManager, s => s.currency),
        tokenIds: $ => {
          const route = $(useNavigationStore, s => s.activeRoute);
          const idsByRoute = $(tokenIdsByRoute, s => s);
          return idsByRoute[route] ?? EMPTY_TOKEN_IDS;
        },
      },
    },

    () => ({
      tokens: {},

      subscribeToToken: (route, tokenId) => {
        if (updateSubscriptionCount(route, tokenId, 1)) publishTokens(route);
        return () => {
          if (updateSubscriptionCount(route, tokenId, -1)) publishTokens(route);
        };
      },

      replaceSubscribedTokens: (route, previous, next) => {
        let changed = false;

        for (const tokenId of next) if (!previous.has(tokenId)) changed = updateSubscriptionCount(route, tokenId, 1) || changed;
        for (const tokenId of previous) if (!next.has(tokenId)) changed = updateSubscriptionCount(route, tokenId, -1) || changed;

        if (changed) publishTokens(route);
      },
    })
  );
}

export function getLiquidityCappedBalance({
  token,
  balanceAmount,
  nativeCurrency,
}: {
  token: TokenData;
  balanceAmount: string;
  nativeCurrency: SupportedCurrencyKey;
}): {
  balance: string;
  isCapped: boolean;
} {
  const liquidityCap = token.reliability?.metadata?.liquidityCap;
  const balance = multiply(token.price, balanceAmount);

  if (liquidityCap && greaterThan(balance, liquidityCap)) {
    return {
      balance: convertAmountToNativeDisplayWorklet(liquidityCap, nativeCurrency),
      isCapped: true,
    };
  }

  return {
    balance: convertAmountAndPriceToNativeDisplay(balanceAmount, token.price, nativeCurrency).display,
    isCapped: false,
  };
}

/**
 * Determines the stale time to use depending on the active route.
 */
function determineStaleTime(state: NavigationState): number {
  switch (state.activeRoute) {
    case Routes.PERPS_NEW_POSITION_SCREEN:
    case Routes.CLOSE_POSITION_BOTTOM_SHEET:
    case Routes.POLYMARKET_EVENT_SCREEN:
      return FAST_REFRESH_STALE_TIME;
    default:
      return DEFAULT_STALE_TIME;
  }
}
