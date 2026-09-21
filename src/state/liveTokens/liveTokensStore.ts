import { createQueryStore } from '@storesjs/stores';

import type { SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { time } from '@/framework/core/utils/time';
import { greaterThan, multiply } from '@/helpers/utilities';
import Routes, { type Route } from '@/navigation/routesNames';
import { ETH_ADDRESS, WETH_ADDRESS } from '@/references/constants';
import { getPlatformClient } from '@/resources/platform/client';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { fetchPolymarketPrices, isPolymarketToken } from '@/state/liveTokens/polymarketAdapter';
import { useNavigationStore, type NavigationState } from '@/state/navigation/navigationStore';

import { useUserAssetsStore } from '../assets/userAssets';
import { isHyperliquidToken, parseHyperliquidTokenId } from './hyperliquidAdapter';
import { fetchHyperliquidPrices } from './hyperliquidPriceService';
import { type LiveTokensData, type TokenData } from './types';

export type { TokenData, LiveTokensData, PriceReliabilityStatus } from './types';

const ETH_MAINNET_TOKEN_ID = `${ETH_ADDRESS}:1`;

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

type TokenSubscription = {
  route: Route;
  tokenIds: string[];
};

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
  tokenIds: string[];
  currency: SupportedCurrencyKey;
};

type LiveTokensStore = {
  subscriptions: Map<symbol, TokenSubscription>;
  tokens: LiveTokensData;
  setSubscription: (owner: symbol, route: Route, tokenIds: string[]) => void;
  removeSubscription: (owner: symbol) => void;
  clear: () => void;
};

const fetchTokensData = async ({ tokenIds: subscribedTokenIds, currency }: LiveTokensParams): Promise<LiveTokensData | null> => {
  const tokenIds = subscribedTokenIds.map(tokenId => (tokenId.includes('_') ? convertLegacyTokenIdToTokenId(tokenId) : tokenId));

  if (tokenIds.length === 0) {
    return null;
  }

  // Separate tokens by type
  const ethVariants: string[] = [];
  const hyperliquidTokens: string[] = [];
  const regularTokens: string[] = [];
  const polymarketTokens: string[] = [];

  tokenIds.forEach(tokenId => {
    if (isHyperliquidToken(tokenId)) {
      hyperliquidTokens.push(tokenId);
    } else if (isPolymarketToken(tokenId)) {
      polymarketTokens.push(tokenId);
    } else if (isEthVariant(tokenId)) {
      ethVariants.push(tokenId);
    } else {
      regularTokens.push(tokenId);
    }
  });

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

export const useLiveTokensStore = createQueryStore<LiveTokensData | null, LiveTokensParams, LiveTokensStore>(
  {
    fetcher: fetchTokensData,
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
      tokenIds: ($, store) => {
        const route = $(useNavigationStore).activeRoute;
        const subscriptions = $(store).subscriptions;
        const tokenIds = new Set<string>();
        for (const subscription of subscriptions.values()) {
          if (subscription.route === route) {
            for (const tokenId of subscription.tokenIds) tokenIds.add(tokenId);
          }
        }
        return Array.from(tokenIds).sort();
      },
      currency: $ => $(userAssetsStoreManager).currency,
    },
  },

  set => ({
    subscriptions: new Map(),
    tokens: {},

    setSubscription: (owner, route, tokenIds) =>
      set(state => {
        const ids = Array.from(new Set(tokenIds)).sort();
        const previous = state.subscriptions.get(owner);
        if (!ids.length && !previous) return state;
        if (previous?.route === route && ids.length === previous.tokenIds.length && ids.every((id, i) => id === previous.tokenIds[i])) {
          return state;
        }

        const subscriptions = new Map(state.subscriptions);
        if (ids.length) subscriptions.set(owner, { route, tokenIds: ids });
        else subscriptions.delete(owner);
        return { subscriptions };
      }),

    removeSubscription: owner =>
      set(state => {
        if (!state.subscriptions.has(owner)) return state;
        const subscriptions = new Map(state.subscriptions);
        subscriptions.delete(owner);
        return { subscriptions };
      }),

    clear: () => set({ subscriptions: new Map(), tokens: {} }),
  })
);

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
