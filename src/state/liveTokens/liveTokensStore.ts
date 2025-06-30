import { time } from '@/utils';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useUserAssetsStore } from '../assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ETH_ADDRESS, SupportedCurrencyKey, WETH_ADDRESS } from '@/references';
import { getPlatformClient } from '@/resources/platform/client';

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
type TokenSubscriptionCountByRoute = Record<string, Record<string, number>>;

export type PriceReliabilityStatus =
  | 'PRICE_RELIABILITY_STATUS_TRUSTED'
  | 'PRICE_RELIABILITY_STATUS_NOT_TRUSTED'
  | 'PRICE_RELIABILITY_STATUS_UNSPECIFIED';

export interface TokenData {
  price: string;
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
  result: LiveTokensData;
  errors?: string[];
};

type LiveTokensParams = {
  subscribedTokensByRoute: TokenSubscriptionCountByRoute;
  activeRoute: string;
  currency: SupportedCurrencyKey;
};

type UpdateSubscribedTokensParams = {
  route: string;
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

  // Separate ETH variants from other tokens
  const ethVariants: string[] = [];
  const otherTokens: string[] = [];

  tokenIds.forEach(tokenId => {
    if (isEthVariant(tokenId)) {
      ethVariants.push(tokenId);
    } else {
      otherTokens.push(tokenId);
    }
  });

  const tokensToFetch = [
    ...otherTokens,
    // Only subscribe to mainnet ETH if we have any ETH variants
    ...(ethVariants.length > 0 ? [ETH_MAINNET_TOKEN_ID] : []),
  ];

  const response = await getPlatformClient().get<LiveTokensResponse>('/prices/GetCurrentPrices', {
    params: {
      tokenIds: tokensToFetch.join(','),
      currency,
    },
  });

  const result: LiveTokensData = {};

  Object.entries(response.data.result).forEach(([tokenId, tokenData]) => {
    if (tokenId !== ETH_MAINNET_TOKEN_ID) {
      result[convertTokenIdToLegacyTokenId(tokenId)] = tokenData;
    }
  });

  // Map ETH data to all ETH variants
  if (response.data.result[ETH_MAINNET_TOKEN_ID]) {
    const ethData = response.data.result[ETH_MAINNET_TOKEN_ID];
    ethVariants.forEach(ethVariant => {
      result[convertTokenIdToLegacyTokenId(ethVariant)] = ethData;
    });
  }

  return result;
};

function updateUserAssetsStore(tokens: LiveTokensData) {
  useUserAssetsStore.getState().updateTokens(tokens);
}

export const useLiveTokensStore = createQueryStore<LiveTokensData | null, LiveTokensParams, LiveTokensStore>(
  {
    fetcher: fetchTokensData,
    disableCache: true,
    staleTime: time.seconds(5),
    setData: ({ data, set }) => {
      if (data) {
        set(state => {
          updateUserAssetsStore(data);
          return {
            ...state,
            tokens: { ...state.tokens, ...data },
          };
        });
      }
    },
    paramChangeThrottle: 250,
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
        if (Object.keys(subscribedTokensByRoute[route]).length === 0) {
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

export function addSubscribedToken({ route, tokenId }: { route: string; tokenId: string }) {
  useLiveTokensStore.getState().addSubscribedTokens({ route, tokenIds: [tokenId] });
}
export function removeSubscribedToken({ route, tokenId }: { route: string; tokenId: string }) {
  useLiveTokensStore.getState().removeSubscribedTokens({ route, tokenIds: [tokenId] });
}

export const { addSubscribedTokens, removeSubscribedTokens } = useLiveTokensStore.getState();
