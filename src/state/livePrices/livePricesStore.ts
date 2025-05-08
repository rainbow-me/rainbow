import { time } from '@/utils';
import { createQueryStore } from '../internal/createQueryStore';
import { useNavigationStore } from '../navigation/navigationStore';

// route -> tokenId -> subscription count
type SubscribedTokens = Record<string, Record<string, number>>;

export interface TokenData {
  price: string;
  priceChange24h: string;
  lastUpdated: number;
}

interface TokenDataResponse {
  [tokenId: string]: TokenData;
}

type LivePricingParams = {
  subscribedTokensByRoute: SubscribedTokens;
  activeRoute: string;
};

interface LivePricingStore {
  subscribedTokensByRoute: SubscribedTokens;
  tokens: {
    [tokenId: string]: TokenData;
  };
  addSubscribedTokens: ({ route, tokenIds }: { route: string; tokenIds: string[] }) => void;
  removeSubscribedTokens: ({ route, tokenIds }: { route: string; tokenIds: string[] }) => void;
  clear: () => void;
}

type UpdateSubscribedTokensParams = {
  route: string;
  tokenIds: string[];
};

const fetchTokensData = async (params: LivePricingParams, abortController: AbortController | null): Promise<TokenDataResponse> => {
  const { subscribedTokensByRoute, activeRoute } = params;

  const tokenIdsArray = Object.keys(subscribedTokensByRoute[activeRoute] || {});

  if (tokenIdsArray.length === 0) {
    return {};
  }

  console.log(`[livePricesStore] MOCK API: Fetching prices for ${tokenIdsArray.length} tokens:`, tokenIdsArray);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

  const assets: TokenDataResponse = {};
  tokenIdsArray.forEach(id => {
    const basePrice = parseInt(id.substring(2, 5), 16) / 10 || 10;
    const fluctuation = (Math.random() - 0.1) * 0.5;
    assets[id] = {
      price: (basePrice + fluctuation).toFixed(2),
      priceChange24h: (fluctuation * 100).toFixed(2),
      lastUpdated: Date.now(),
    };
  });

  return assets;
};

export const useLivePricingStore = createQueryStore<TokenDataResponse, LivePricingParams, LivePricingStore>(
  {
    fetcher: fetchTokensData,
    disableCache: true,
    staleTime: time.seconds(5),
    setData: ({ data, set }) => {
      if (data) {
        set(state => {
          return {
            ...state,
            tokens: { ...state.tokens, ...data },
          };
        });
      }
    },
    params: {
      subscribedTokensByRoute: ($, store) => $(store).subscribedTokensByRoute,
      activeRoute: $ => $(useNavigationStore).activeRoute,
    },
  },

  (set, get) => ({
    subscribedTokensByRoute: {},
    tokens: {},

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
          ...state,
          subscribedTokensByRoute,
        };
      });
    },

    removeSubscribedTokens({ route, tokenIds }: UpdateSubscribedTokensParams) {
      set(state => {
        const { subscribedTokensByRoute } = state;

        let hasChanges = false;
        for (const tokenId of tokenIds) {
          if (subscribedTokensByRoute[route][tokenId]) {
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
          ...state,
          subscribedTokensByRoute,
        };
      });
    },

    clear() {
      set({
        subscribedTokensByRoute: {},
        tokens: {},
      });
    },
  })
);

export function addSubscribedToken({ route, tokenId }: { route: string; tokenId: string }) {
  useLivePricingStore.getState().addSubscribedTokens({ route, tokenIds: [tokenId] });
}

export function removeSubscribedToken({ route, tokenId }: { route: string; tokenId: string }) {
  useLivePricingStore.getState().removeSubscribedTokens({ route, tokenIds: [tokenId] });
}
