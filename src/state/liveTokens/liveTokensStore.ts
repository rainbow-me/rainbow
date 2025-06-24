import { time } from '@/utils';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useUserAssetsStore } from '../assets/userAssets';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { SupportedCurrencyKey } from '@/references';
import { getPlatformClient } from '@/resources/platform/client';

function convertLegacyTokenIdToTokenId(tokenId: string): string {
  const [tokenAddress, chainId] = tokenId.split('_');
  return `${tokenAddress}:${chainId}`;
}

function convertTokenIdToLegacyTokenId(tokenId: string): string {
  const [tokenAddress, chainId] = tokenId.split(':');
  return `${tokenAddress}_${chainId}`;
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
    marketCapFDV: string;
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
  // TODO: get types from backend
  errors: any[];
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
  const tokenIdsArray = Object.keys(subscribedTokensByRoute[activeRoute] || {});

  if (tokenIdsArray.length === 0) {
    return null;
  }

  const response = await getPlatformClient().get<LiveTokensResponse>('/prices/GetCurrentPrices', {
    params: {
      tokenIds: tokenIdsArray.map(convertLegacyTokenIdToTokenId).join(','),
      currency,
    },
  });

  return Object.fromEntries(
    Object.entries(response.data.result).map(([platformTokenId, tokenData]) => [convertTokenIdToLegacyTokenId(platformTokenId), tokenData])
  );
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
