import { time } from '@/utils';
import { createQueryStore } from '../internal/createQueryStore';
import { useNavigationStore } from '../navigation/navigationStore';

type TokensByRoute = Map<string, Set<string>>;

interface TokenData {
  price: string;
  priceChange24h: string;
  lastUpdated: number;
}

interface TokenDataResponse {
  [tokenId: string]: TokenData;
}

type LivePricingParams = {
  subscribedTokensByRoute: TokensByRoute;
  activeRoute: string;
};

interface LivePricingStore {
  subscribedTokensByRoute: TokensByRoute;
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
  if (!subscribedTokensByRoute.has(activeRoute)) {
    return {};
  }

  const tokenIdsArray = Array.from(subscribedTokensByRoute.get(activeRoute) || []);

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
    onFetched: ({ data, params, set }) => {
      // prune the tokens that are not part of the route
      //
    },
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
    subscribedTokensByRoute: new Map<string, Set<string>>(),
    tokens: {},

    addSubscribedTokens({ route, tokenIds }: UpdateSubscribedTokensParams) {
      set(state => {
        const { subscribedTokensByRoute } = state;

        // TODO: deduplicate tokenUniqueIds, remove tokens where we only need to fetch the mainnet price
        let hasChanges = false;
        for (const tokenId of tokenIds) {
          if (!subscribedTokensByRoute.get(route)?.has(tokenId)) {
            subscribedTokensByRoute.get(route)?.add(tokenId);
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
          if (subscribedTokensByRoute.get(route)?.has(tokenId)) {
            subscribedTokensByRoute.get(route)?.delete(tokenId);
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

    clear() {
      set({
        subscribedTokensByRoute: new Map<string, Set<string>>(),
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
