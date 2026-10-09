import { createBaseStore, createQueryStore, type QueryStore } from '@storesjs/stores';

import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { time } from '@/framework/core/utils/time';
import { greaterThan, multiply } from '@/helpers/utilities';
import Routes, { type Route } from '@/navigation/routesNames';
import { ETH_ADDRESS, WETH_ADDRESS } from '@/references/constants';
import { getPlatformClient } from '@/resources/platform/client';
import { useAppStateStore } from '@/state/appState/appStateStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { fetchPolymarketPrices, isPolymarketToken } from '@/state/liveTokens/polymarketAdapter';
import { useNavigationStore, type NavigationState } from '@/state/navigation/navigationStore';

import { useUserAssetsStore } from '../assets/userAssets';
import { isHyperliquidToken, parseHyperliquidTokenId } from './hyperliquidAdapter';
import { fetchHyperliquidPrices } from './hyperliquidPriceService';
import { type LiveTokensData, type TokenData } from './types';

export type { TokenData, LiveTokensData, PriceReliabilityStatus } from './types';

const ETH_MAINNET_TOKEN_ID = `${ETH_ADDRESS}:1`;
const EMPTY_TOKEN_IDS: readonly string[] = [];

function convertLegacyTokenIdToTokenId(tokenId: string): string {
  const [tokenAddress, chainId] = tokenId.split('_');
  return `${tokenAddress}:${chainId}`;
}

function convertTokenIdToLegacyTokenId(tokenId: string): string {
  const [tokenAddress, chainId] = tokenId.split(':');
  return `${tokenAddress}_${chainId}`;
}

// Only works for tokens the user owns
function isEthVariant(tokenId: string) {
  const userAsset = useUserAssetsStore.getState().getUserAsset(convertTokenIdToLegacyTokenId(tokenId));
  return userAsset && (userAsset.mainnetAddress === ETH_ADDRESS || userAsset.mainnetAddress === WETH_ADDRESS);
}

type LiveTokensResponse = {
  metadata: {
    currency: string;
    requestId: string;
    requestTime: string;
  };
  result?: LiveTokensData;
  errors?: string[];
};

type LiveTokensParams = {
  tokenIds: readonly string[];
  currency: SupportedCurrencyKey;
};

type LiveTokensStore = {
  tokens: LiveTokensData;
  /** Subscribes to a token until the returned cleanup function is called. */
  subscribeToToken: (route: Route, tokenId: string) => () => void;
  /** Replaces one subscriber's token set without changing other subscribers' counts. */
  replaceSubscribedTokens: (route: Route, previous: ReadonlySet<string>, next: ReadonlySet<string>) => void;
};

const fetchTokensData = async ({ tokenIds, currency }: LiveTokensParams): Promise<LiveTokensData | null> => {
  if (tokenIds.length === 0) {
    return null;
  }

  // Separate tokens by type
  const ethVariants: string[] = [];
  const hyperliquidTokens: string[] = [];
  const regularTokens: string[] = [];
  const polymarketTokens: string[] = [];

  for (const id of tokenIds) {
    const tokenId = id.includes('_') ? convertLegacyTokenIdToTokenId(id) : id;

    if (isHyperliquidToken(tokenId)) {
      hyperliquidTokens.push(tokenId);
    } else if (isPolymarketToken(tokenId)) {
      polymarketTokens.push(tokenId);
    } else if (isEthVariant(tokenId)) {
      ethVariants.push(tokenId);
    } else {
      regularTokens.push(tokenId);
    }
  }

  // Only subscribe to mainnet ETH if we have any ETH variants
  if (ethVariants.length > 0) regularTokens.push(ETH_MAINNET_TOKEN_ID);

  const regularTokensPromise =
    regularTokens.length > 0
      ? getPlatformClient().get<LiveTokensResponse>('/prices/GetCurrentPrices', {
          params: {
            tokenIds: regularTokens.join(','),
            currency,
          },
        })
      : null;

  const hyperliquidPricesPromise =
    hyperliquidTokens.length > 0
      ? fetchHyperliquidPrices(
          hyperliquidTokens
            .map(tokenId => {
              const parsed = parseHyperliquidTokenId(tokenId);
              return parsed?.symbol || '';
            })
            .filter(Boolean)
        )
      : null;

  const polymarketPricesPromise = polymarketTokens.length > 0 ? fetchPolymarketPrices(polymarketTokens) : null;

  const [regularTokensResponse, hyperliquidPrices, polymarketPrices] = await Promise.all([
    regularTokensPromise,
    hyperliquidPricesPromise,
    polymarketPricesPromise,
  ]);

  const result: LiveTokensData = {};
  let hasResult = false;

  // Process regular tokens
  if (regularTokensResponse?.data.result) {
    Object.entries(regularTokensResponse.data.result).forEach(([tokenId, tokenData]) => {
      if (tokenId !== ETH_MAINNET_TOKEN_ID) {
        result[convertTokenIdToLegacyTokenId(tokenId)] = tokenData;
        hasResult = true;
      }
    });

    // Map ETH data to all ETH variants
    const ethMainnetData = regularTokensResponse.data.result[ETH_MAINNET_TOKEN_ID];
    if (ethMainnetData) {
      ethVariants.forEach(ethVariant => {
        result[convertTokenIdToLegacyTokenId(ethVariant)] = ethMainnetData;
        hasResult = true;
      });
    }
  }

  // Add Hyperliquid prices to result
  if (hyperliquidPrices) {
    Object.assign(result, hyperliquidPrices);
    hasResult = true;
  }

  // Add Polymarket prices to result
  if (polymarketPrices) {
    Object.assign(result, polymarketPrices);
    hasResult = true;
  }

  return hasResult ? result : null;
};

function updateUserAssetsStore(tokens: LiveTokensData) {
  useUserAssetsStore.getState().updateTokens(tokens);
}

const DEFAULT_STALE_TIME = time.seconds(5);
const FAST_REFRESH_STALE_TIME = time.seconds(2);

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
    const next = { ...tokenIdsByRoute.getState() };

    if (counts) next[route] = Array.from(counts.keys()).sort();
    else delete next[route];

    tokenIdsByRoute.setState(next, true);
  }

  return createQueryStore<LiveTokensData | null, LiveTokensParams, LiveTokensStore>(
    {
      fetcher: fetchTokensData,
      enabled: $ => $(useAppStateStore, s => s === 'active'),
      disableCache: true,
      staleTime: $ => $(useNavigationStore, determineStaleTime),
      setData: ({ data, set }) => {
        if (!data) return;
        set(state => ({
          ...state,
          tokens: { ...state.tokens, ...data },
        }));
      },
      onFetched: ({ data }) => {
        if (data) updateUserAssetsStore(data);
      },
      paramChangeThrottle: time.ms(250),
      params: {
        tokenIds: $ => {
          const route = $(useNavigationStore, s => s.activeRoute);
          const idsByRoute = $(tokenIdsByRoute, s => s);
          return idsByRoute[route] ?? EMPTY_TOKEN_IDS;
        },
        currency: $ => $(userAssetsStoreManager, s => s.currency),
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
        for (const tokenId of next) {
          if (!previous.has(tokenId)) changed = updateSubscriptionCount(route, tokenId, 1) || changed;
        }
        for (const tokenId of previous) {
          if (!next.has(tokenId)) changed = updateSubscriptionCount(route, tokenId, -1) || changed;
        }
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
  const liquidityCap = token.reliability?.metadata?.liquidityCap ?? '';
  const balance = multiply(token.price, balanceAmount);

  if (liquidityCap !== '' && greaterThan(balance, liquidityCap)) {
    const cappedDisplay = convertAmountToNativeDisplayWorklet(liquidityCap, nativeCurrency);
    return {
      balance: cappedDisplay,
      isCapped: true,
    };
  }

  const { display } = convertAmountAndPriceToNativeDisplay(balanceAmount, token.price, nativeCurrency);

  return {
    balance: display,
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
