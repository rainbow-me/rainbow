import { time } from '@/utils/time';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { NavigationState, useNavigationStore } from '@/state/navigation/navigationStore';
import { useUserAssetsStore } from '../assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import type { SupportedCurrencyKey } from '@/references/supportedCurrencies';
import { getPlatformClient } from '@/resources/platform/client';
import { convertAmountAndPriceToNativeDisplay, convertAmountToNativeDisplayWorklet, greaterThan, multiply } from '@/helpers/utilities';
import { fetchHyperliquidPrices } from './hyperliquidPriceService';
import Routes, { Route } from '@/navigation/routesNames';
import { isHyperliquidToken, parseHyperliquidTokenId } from './hyperliquidAdapter';
import { isPolymarketToken, fetchPolymarketPrices } from '@/state/liveTokens/polymarketAdapter';

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

// route -> token id -> subscription count
type TokenSubscriptionCountByRoute = {
  [route in Route]?: {
    [tokenId: string]: number | undefined;
  };
};

export type PriceReliabilityStatus =
  | 'PRICE_RELIABILITY_STATUS_TRUSTED'
  | 'PRICE_RELIABILITY_STATUS_NOT_TRUSTED'
  | 'PRICE_RELIABILITY_STATUS_UNSPECIFIED';

export interface TokenData {
  price: string;
  // This is exclusively for Hyperliquid markets
  midPrice?: string | null;
  change: {
    change5mPct: string;
    change1hPct: string;
    change4hPct: string;
    change12hPct: string;
    change24hPct: string;
  };
  marketData: {
    circulatingMarketCap: string;
  };
  reliability: {
    metadata: {
      liquidityCap: string;
    };
    status: PriceReliabilityStatus;
  };
  updateTime: string;
}

export interface LiveTokensData {
  [tokenId: string]: TokenData;
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
  subscribedTokensByRoute: TokenSubscriptionCountByRoute;
  activeRoute: Route;
  currency: SupportedCurrencyKey;
};

type UpdateSubscribedTokensParams = {
  route: Route;
  tokenIds: string[];
};

type LiveTokenStoreState = {
  subscribedTokensByRoute: TokenSubscriptionCountByRoute;
  tokens: LiveTokensData;
};

type LiveTokenStoreActions = {
  removeSubscribedTokens: ({ route, tokenIds }: UpdateSubscribedTokensParams) => void;
  addSubscribedTokens: ({ route, tokenIds }: UpdateSubscribedTokensParams) => void;
  clear: () => void;
};

type LiveTokensStore = LiveTokenStoreState & LiveTokenStoreActions;

const initialState: LiveTokenStoreState = {
  subscribedTokensByRoute: {},
  tokens: {},
};

const fetchTokensData = async ({ subscribedTokensByRoute, activeRoute, currency }: LiveTokensParams): Promise<LiveTokensData | null> => {
  const tokenIds = Object.keys(subscribedTokensByRoute[activeRoute] || {}).map(tokenId => {
    if (tokenId.includes('_')) {
      return convertLegacyTokenIdToTokenId(tokenId);
    }
    return tokenId;
  });

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
      subscribedTokensByRoute: ($, store) => $(store).subscribedTokensByRoute,
      activeRoute: $ => $(useNavigationStore).activeRoute,
      currency: $ => $(userAssetsStoreManager).currency,
    },
  },

  set => ({
    ...initialState,
    addSubscribedTokens({ route, tokenIds }: UpdateSubscribedTokensParams) {
      set(state => {
        const { subscribedTokensByRoute } = state;

        // TODO: deduplicate tokenUniqueIds, remove tokens where we only need to fetch the mainnet price
        let hasChanges = false;

        if (!subscribedTokensByRoute[route]) {
          subscribedTokensByRoute[route] = {};
        }

        for (const tokenId of tokenIds) {
          if (!subscribedTokensByRoute[route][tokenId]) {
            subscribedTokensByRoute[route][tokenId] = (subscribedTokensByRoute[route][tokenId] ?? 0) + 1;
            hasChanges = true;
          }
        }

        if (!hasChanges) return state;

        return {
          subscribedTokensByRoute,
        };
      });
    },

    removeSubscribedTokens({ route, tokenIds }: UpdateSubscribedTokensParams) {
      set(state => {
        const { subscribedTokensByRoute } = state;

        let hasChanges = false;
        for (const tokenId of tokenIds) {
          if (subscribedTokensByRoute[route]?.[tokenId]) {
            subscribedTokensByRoute[route][tokenId] -= 1;
            if (subscribedTokensByRoute[route][tokenId] === 0) {
              delete subscribedTokensByRoute[route][tokenId];
            }
            hasChanges = true;
          }
        }

        if (!hasChanges) return state;

        // remove routes with no subscriptions
        const routeSubscriptions = subscribedTokensByRoute[route];
        if (!routeSubscriptions || Object.keys(routeSubscriptions).length === 0) {
          delete subscribedTokensByRoute[route];
        }

        return {
          subscribedTokensByRoute,
        };
      });
    },

    clear() {
      set({ ...initialState });
    },
  })
);

export const { addSubscribedTokens, removeSubscribedTokens } = useLiveTokensStore.getState();

export function addSubscribedToken({ route, tokenId }: { route: Route; tokenId: string }) {
  addSubscribedTokens({ route, tokenIds: [tokenId] });
}
export function removeSubscribedToken({ route, tokenId }: { route: Route; tokenId: string }) {
  removeSubscribedTokens({ route, tokenIds: [tokenId] });
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
